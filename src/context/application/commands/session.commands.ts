import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { NotificationTopicAction, BlacklistTopicAction, EntityType, KafkaTopic, ActionType } from "~context/enums";
import { SESSION_REFRESH_IDEMPOTENCY_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { SESSION_SERVICE } from "~context/domain/services";
import { ErrorCode, Exception } from "~common/exceptions";

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
                const result = await this.sessionService.create({
                    transaction,
                    input: {
                        userAgent: props.context.userAgent,
                        account: props.input.account,
                        client: props.input.client,
                        realms: props.input.realms,
                        scope: props.input.scope,
                        nonce: props.input.nonce,
                        ip: props.context.ip,
                        acr: props.input.acr,
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
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN`,
                code: ErrorCode.INVALID_REQUEST,
            });
        }

        const idempotencyKey = this.cryptoService.hashToken({
            token: `${props.input.client}:${props.input.refreshToken}`,
        });

        const cachedResult = await this.refreshIdempotencyService.get({ key: idempotencyKey });

        if (cachedResult) {
            return cachedResult;
        } else {
            const payload = await this.jwtService.verifyRefresh({ token: props.input.refreshToken });
            const tokenHash = this.cryptoService.hashToken({ token: props.input.refreshToken });

            const outcome = await this.transactionalService.run<Commands.Session.Refresh.ExecuteResult>({
                resource: this.resource,
                outbox: {
                    payloadMapper: this.mapper.refreshBlacklistPayload,
                    destinationTopic: KafkaTopic.BLACKLIST,
                    actionType: BlacklistTopicAction.ADD,
                },
                audit: {
                    input: { session: payload.sid as string },
                    entityType: EntityType.SESSION,
                    actionType: ActionType.REFRESH,
                    context: props.context,
                },
                execute: async (transaction): Promise<Commands.Session.Refresh.ExecuteResult> => {
                    const rotation = await this.sessionService.refresh({
                        input: {
                            session: payload.sid as string,
                            client: props.input.client,
                            tokenHash,
                        },
                        transaction,
                    });

                    if (rotation.kind === "ROTATED") {
                        return rotation;
                    } else {
                        const raceCachedResult = await this.refreshIdempotencyService.get({ key: idempotencyKey });

                        if (raceCachedResult) {
                            return { kind: "REPLAYED", result: raceCachedResult };
                        } else {
                            const sessions = await this.sessionService.revoke({
                                input: { sessions: [rotation.session] },
                                transaction,
                            });

                            return { kind: "REUSE_DETECTED", sessions };
                        }
                    }
                },
            });

            switch (outcome.kind) {
                case "ROTATED": {
                    const result: Awaited<Commands.Session.Refresh.Result> = {
                        message: `${this.dictionaryPath}.REFRESHED`,
                        refreshToken: outcome.refreshToken,
                        accessToken: outcome.accessToken,
                    };
                    await this.refreshIdempotencyService.set({ key: idempotencyKey, result });
                    return result;
                }
                case "REPLAYED":
                    return outcome.result;
                default:
                    throw Exception.badRequest({
                        messageKey: `${this.dictionaryPath}.REFRESH_TOKEN_REUSE_DETECTED`,
                        code: ErrorCode.INVALID_GRANT,
                    });
            }
        }
    }

    public async revoke(props: Commands.Session.Revoke.Props): Commands.Session.Revoke.Result {
        const { input, actor, session } = props;
        const isLogout = !("token" in input) && !input.sessions?.length;

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
                const sessions = await this.sessionService.revoke({
                    input:
                        "token" in input
                            ? { account: actor, token: input.token }
                            : { account: actor, current: session, sessions: input.sessions },
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
                const sessions = await this.sessionService.revokeAll({ input: { account: props.actor }, transaction });

                return { sessions };
            },
        });

        return { message: `${this.dictionaryPath}.REVOKED_ALL` };
    }
}
