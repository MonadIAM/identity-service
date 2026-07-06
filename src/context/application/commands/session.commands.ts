import { Inject, Injectable, Scope } from "@nestjs/common";
import { BlacklistTopicAction } from "@monadiam/contracts";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { EntityType, KafkaTopic, ActionType, AccountStatus } from "~context/enums";
import { ACCOUNT_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SessionCommands implements Commands.Session.Contract {
    private readonly dictionaryPath = "commands.session";
    private readonly resource = "Session";
    private readonly sessionTTL: number;

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
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
            outbox: {
                payloadMapper: ({ revokedSessions }) => revokedSessions,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
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

                return this.sessionService.create({
                    transaction,
                    input: {
                        userAgent: props.context.userAgent,
                        client: props.input.client,
                        ip: props.context.ip,
                        account,
                    },
                });
            },
        });

        return {
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
        };
    }

    public async refresh(props: Commands.Session.Refresh.Props): Commands.Session.Refresh.Result {
        if (!props.input.refreshToken) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN` });
        }

        const payload = await this.jwtService.verifyRefresh(props.input.refreshToken);

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

        const tokenHash = this.cryptoService.hashToken(props.input.refreshToken);

        if (tokenHash !== session.refreshTokenHash) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN` });
        }

        const refreshToken = await this.jwtService.signRefreshToken({
            client_id: session.client,
            sub: session.account.id,
            sid: session.id,
        });

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SESSION,
                actionType: ActionType.REFRESH,
                context: props.context,
                input: { session: session.id },
            },
            execute: (transaction) => {
                transaction.merge(session);
                session.refresh(this.cryptoService.hashToken(refreshToken));
            },
        });

        const accessToken = await this.jwtService.signAccessToken({
            client_id: session.client,
            sub: session.account.id,
            sid: session.id,
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
                payloadMapper: this.outboxPayloadMapper.bind(this),
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            execute: async (transaction) => {
                let sessions: Entities.Session[];

                if ("refreshToken" in props.input) {
                    const session = await this.sessionRepository.findUnique({
                        where: {
                            refreshTokenHash: this.cryptoService.hashToken(props.input.refreshToken),
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
                payloadMapper: this.outboxPayloadMapper.bind(this),
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

    public outboxPayloadMapper(
        sessions: Commands.Session.OutboxPayloadMapper.Props,
    ): Commands.Session.OutboxPayloadMapper.Result {
        return sessions.map(({ id, lastRefreshedAt }) => ({
            expiresAt: Math.round(lastRefreshedAt.getTime() + this.sessionTTL * 1e3),
            session: id,
        }));
    }
}
