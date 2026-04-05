import { Inject, Injectable, Scope } from "@nestjs/common";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { SESSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SessionCommands implements Commands.Session.Contract {
    private readonly dictionaryPath = "commands.session";
    private readonly resource = "Session";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
    ) {}

    public async refresh(props: Commands.Session.Refresh.Props): Promise<Commands.Session.Refresh.Result> {
        if (props.input.refreshToken) {
            const session = await this.sessionRepository.findUnique({
                options: { populate: ["account"] },
                where: { id: props.input.session },
            });

            if (session) {
                session.isExpired();

                const tokenHash = this.cryptoService.hashToken(props.input.refreshToken);

                if (tokenHash === session.refreshTokenHash) {
                    const refreshToken = await this.jwtService.signRefreshToken({
                        sub: session.account.id,
                        jti: session.id,
                    });

                    await this.transactional.run({
                        resource: this.resource,
                        audit: {
                            actionType: IdentityActionType.CREATE_SESSION,
                            entityType: IdentityEntityType.ACCOUNT,
                            ...props,
                        },
                        execute: (transaction) => {
                            transaction.merge(session);
                            session.refresh(this.cryptoService.hashToken(refreshToken));
                        },
                    });

                    const accessToken = await this.jwtService.signAccessToken({
                        sub: session.account.id,
                        jti: session.id,
                    });

                    return { message: `${this.dictionaryPath}.REFRESHED`, accessToken, refreshToken };
                } else {
                    throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_REFRESH_TOKEN`);
                }
            } else {
                throw CommandException.unauthorized(`${this.dictionaryPath}.SESSION_NOT_FOUND`);
            }
        } else {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_REFRESH_TOKEN`);
        }
    }

    public async purge(props: Commands.Session.Purge): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.PURGE_SESSIONS,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const sessions = await this.sessionRepository.find({
                    where: {
                        id: { $in: props.input.sessions },
                        account: props.actor,
                    },
                    transaction,
                });

                this.sessionService.purge({
                    transaction,
                    input: { sessions },
                });
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async purgeAll(props: Commands.Session.PurgeAll): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.PURGE_SESSIONS,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: props.actor },
                    transaction,
                });

                this.sessionService.purge({
                    input: { sessions: account.sessions.getItems() },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.ALL_PURGED` };
    }
}
