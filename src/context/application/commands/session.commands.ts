import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { SESSION_REFRESH_IDEMPOTENCY_SERVICE } from "~context/infrastructure/services";
import { ACCOUNT_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";
import {
    NotificationTopicAction,
    BlacklistTopicAction,
    AccountStatus,
    EntityType,
    KafkaTopic,
    ActionType,
} from "~context/enums";

import { SessionMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class SessionCommands implements Commands.Session.Contract {
    private readonly dictionaryPath = "commands.session";
    private readonly resource = "Session";
    private readonly sessionTTL: number;
    private readonly mapper: Commands.Mappers.Session.Contract;

    public constructor(
        @Inject(SESSION_REFRESH_IDEMPOTENCY_SERVICE)
        private readonly refreshIdempotencyService: InfrastructureServices.SessionRefreshIdempotency.PublicContract,
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
        this.mapper = new SessionMapper(this.sessionTTL);
    }

    public async create(props: Commands.Session.Create.Props): Commands.Session.Create.Result {
        const session = await this.transactionalService.run<Commands.Mappers.Session.CreateResult>({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.blacklistPayload,
                    destinationTopic: KafkaTopic.BLACKLIST,
                    actionType: BlacklistTopicAction.ADD,
                },
                {
                    payloadMapper: this.mapper.notificationPayload,
                    destinationTopic: KafkaTopic.NOTIFICATION,
                    actionType: NotificationTopicAction.CREATE,
                },
            ],
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.SIGN_IN,
                context: props.context,
                input: props.input,
            },
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

                const result = await this.sessionService.create({
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

                return { ...result, account: props.input.account };
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

        const idempotencyKey = this.cryptoService.hashToken({
            token: `${props.input.client}:${props.input.refreshToken}`,
        });

        const cachedResult = await this.refreshIdempotencyService.get({ key: idempotencyKey });

        if (cachedResult) {
            return cachedResult;
        } else {
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
                await this.transactionalService.run({
                    resource: this.resource,
                    outbox: {
                        payloadMapper: this.mapper.blacklistPayload,
                        destinationTopic: KafkaTopic.BLACKLIST,
                        actionType: BlacklistTopicAction.ADD,
                    },
                    audit: {
                        entityType: EntityType.SESSION,
                        actionType: ActionType.REVOKE,
                        context: props.context,
                        input: { session: session.id },
                    },
                    execute: (transaction) => {
                        this.sessionService.purge({ input: { sessions: [session] }, transaction });
                        return { sessions: [session] };
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

            const result: Awaited<Commands.Session.Refresh.Result> = {
                message: `${this.dictionaryPath}.REFRESHED`,
                refreshToken,
                accessToken,
            };

            await this.refreshIdempotencyService.set({ key: idempotencyKey, result });

            return result;
        }
    }

    public async revoke(props: Commands.Session.Revoke.Props): Commands.Session.Revoke.Result {
        const { input, actor, session } = props;
        let isLogout = false;
        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.blacklistPayload,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            execute: async (transaction) => {
                let sessions: Entities.Session[];

                if ("token" in input) {
                    const session = await this.sessionRepository.findUnique({
                        where: {
                            refreshTokenHash: this.cryptoService.hashToken({ token: input.token }),
                            account: actor,
                        },
                        transaction,
                    });

                    sessions = session ? [session] : [];
                } else {
                    isLogout = !input.sessions?.length;
                    sessions = await this.sessionRepository.find({
                        where: {
                            id: input.sessions?.length ? { $in: input.sessions } : session,
                            account: actor,
                        },
                        transaction,
                    });
                }

                this.sessionService.purge({
                    input: { sessions },
                    transaction,
                });

                return { sessions };
            },
        });

        if (isLogout) {
            return { message: `${this.dictionaryPath}.LOGOUT` };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async revokeAll(props: Commands.Session.RevokeAll.Props): Commands.Session.RevokeAll.Result {
        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.blacklistPayload,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REVOKE,
                ...props,
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

                return { sessions };
            },
        });

        return { message: `${this.dictionaryPath}.REVOKED_ALL` };
    }
}
