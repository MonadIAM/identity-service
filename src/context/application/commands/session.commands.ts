import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import {
    NotificationContentKind,
    NotificationTopicAction,
    NotificationCategory,
    BlacklistTopicAction,
    PlatformService,
    MessageTemplate,
} from "@monadiam/shared";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/domain/repositories";
import { EntityType, KafkaTopic, ActionType, AccountStatus } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { ACCOUNT_SERVICE, SESSION_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class SessionCommands implements Commands.Session.Contract {
    private readonly dictionaryPath = "commands.session";
    private readonly resource = "Session";
    private readonly sessionTTL: number;

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.CommandContract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.CommandContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.PublicContract,
        protected readonly configService: ConfigService,
    ) {
        this.sessionTTL = ms(this.configService.getOrThrow<StringValue>("JWT_ACCESS_TTL")) / 1e3;
    }

    public async create(props: Commands.Session.Create.Props): Commands.Session.Create.Result {
        const session = await this.transactionalService.run<Awaited<Services.Session.Create.Result>>({
            resource: this.resource,
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.SIGN_IN,
                context: props.context,
                input: props.input,
            },
            outbox: [
                {
                    payloadMapper: this.blacklistPayloadMapper.bind(this),
                    destinationTopic: KafkaTopic.BLACKLIST,
                    actionType: BlacklistTopicAction.ADD,
                },
                {
                    payloadMapper: this.notificationPayloadMapper.bind(this, { account: props.input.account }),
                    destinationTopic: KafkaTopic.NOTIFICATION,
                    actionType: NotificationTopicAction.CREATE,
                },
            ],
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    where: { id: props.input.account },
                    transaction,
                });

                if (account.status === AccountStatus.SUSPENDED || account.status === AccountStatus.PENDING) {
                    throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_AUTHENTICATABLE` });
                }

                if (account.status === AccountStatus.DEACTIVATED) {
                    this.accountService.restore({ input: { account } });
                }

                account.touch();

                return this.sessionService.create({
                    transaction,
                    input: {
                        userAgent: props.context.userAgent,
                        client: props.input.client,
                        realms: props.input.realms,
                        scope: props.input.scope,
                        nonce: props.input.nonce,
                        ip: props.context.ip,
                        acr: props.input.acr,
                        account,
                    },
                });
            },
        });

        return {
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
            idToken: session.idToken,
        };
    }

    public async refresh(props: Commands.Session.Refresh.Props): Commands.Session.Refresh.Result {
        if (!props.input.refreshToken) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN` });
        }

        const payload = await this.jwtService.verifyRefresh({ token: props.input.refreshToken });

        const session = await this.sessionRepository.findUnique({
            where: { id: payload.sid as string },
            options: { populate: ["account"] },
        });

        if (!session) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.SESSION_NOT_FOUND` });
        }

        if (props.input.client !== session.client || payload.client_id !== session.client) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN` });
        }

        session.isExpired();

        const tokenHash = this.cryptoService.hashToken({ token: props.input.refreshToken });

        if (tokenHash !== session.refreshTokenHash) {
            await this.transactionalService.run<Entities.Session[]>({
                resource: this.resource,
                audit: {
                    entityType: EntityType.SESSION,
                    actionType: ActionType.REVOKE,
                    context: props.context,
                    input: { session: session.id },
                },
                outbox: {
                    payloadMapper: this.blacklistPayloadMapper.bind(this),
                    destinationTopic: KafkaTopic.BLACKLIST,
                    actionType: BlacklistTopicAction.ADD,
                },
                execute: (transaction) => {
                    this.sessionService.purge({ input: { sessions: [session] }, transaction });
                    return [session];
                },
            });

            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.REFRESH_TOKEN_REUSE_DETECTED` });
        }

        const refreshToken = await this.jwtService.signRefreshToken({
            payload: {
                client_id: session.client,
                sub: session.account.id,
                realms: session.realms,
                sid: session.id,
            },
        });

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REFRESH,
                input: { session: session.id },
                context: props.context,
            },
            execute: (transaction) => {
                transaction.merge(session);
                session.refresh(this.cryptoService.hashToken({ token: refreshToken }));
            },
        });

        const accessToken = await this.jwtService.signAccessToken({
            payload: {
                auth_time: Math.floor(session.createdAt.getTime() / 1e3),
                ...(session.scope ? { scope: session.scope } : {}),
                client_id: session.client,
                sub: session.account.id,
                realms: session.realms,
                acr: session.acr,
                sid: session.id,
            },
        });

        return { message: `${this.dictionaryPath}.REFRESHED`, accessToken, refreshToken };
    }

    public async revoke(props: Commands.Session.Revoke.Props): Commands.Session.Revoke.Result {
        let isLogout = false;
        await this.transactionalService.run<Entities.Session[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            outbox: {
                payloadMapper: this.blacklistPayloadMapper.bind(this),
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            execute: async (transaction) => {
                let sessions: Entities.Session[];

                if ("refreshToken" in props.input) {
                    const session = await this.sessionRepository.findUnique({
                        where: {
                            refreshTokenHash: this.cryptoService.hashToken({ token: props.input.refreshToken }),
                            account: props.actor,
                        },
                        transaction,
                    });

                    sessions = session ? [session] : [];
                } else {
                    isLogout = !props.input.sessions?.length;
                    sessions = await this.sessionRepository.find({
                        where: {
                            id: props.input.sessions?.length ? { $in: props.input.sessions } : props.session,
                            account: props.actor,
                        },
                        transaction,
                    });
                }

                this.sessionService.purge({
                    input: { sessions },
                    transaction,
                });

                return sessions;
            },
        });

        if (isLogout) {
            return { message: `${this.dictionaryPath}.LOGOUT` };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async revokeAll(props: Commands.Session.RevokeAll.Props): Commands.Session.RevokeAll.Result {
        await this.transactionalService.run<Entities.Session[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            outbox: {
                payloadMapper: this.blacklistPayloadMapper.bind(this),
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: props.actor },
                    transaction,
                });

                const sessions = account.sessions.getItems();

                this.sessionService.purge({
                    input: { sessions },
                    transaction,
                });

                return sessions;
            },
        });

        return { message: `${this.dictionaryPath}.REVOKED_ALL` };
    }

    public notificationPayloadMapper(
        props: Commands.Session.NotificationPayloadMapper.Props,
    ): Commands.Session.NotificationPayloadMapper.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            template: MessageTemplate.LOGIN_ALERT,
            recipient: props.account,
            language: "en",
        };
    }

    public blacklistPayloadMapper(
        props: Commands.Session.BlacklistPayloadMapper.Props,
    ): Commands.Session.BlacklistPayloadMapper.Result {
        if (Array.isArray(props)) {
            return props.map(({ id, lastRefreshedAt }) => ({
                expiresAt: Math.round(lastRefreshedAt.getTime() + this.sessionTTL * 1e3),
                session: id,
            }));
        } else {
            return props.revokedSessions;
        }
    }
}
