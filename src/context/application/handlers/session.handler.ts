import { Inject, Injectable, Scope } from "@nestjs/common";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { SESSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SessionHandler implements Handlers.Session.Contract {
    private readonly dictionaryPath = "handlers.session";
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

    public async refresh(props: Handlers.Session.Refresh.Props): Promise<Handlers.Session.Refresh.Result> {
        const sessionEntity = await this.sessionRepository.findUnique({
            options: { populate: ["account"] },
            where: { id: props.input.session },
        });

        if (!sessionEntity) {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.SESSION_NOT_FOUND`);
        }

        if (sessionEntity.expiresAt < new Date()) {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.SESSION_EXPIRED`);
        }

        const tokenHash = this.cryptoService.hashToken(props.input.refreshToken);
        if (tokenHash !== sessionEntity.refreshTokenHash) {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_REFRESH_TOKEN`);
        }

        const newRefreshToken = await this.jwtService.signRefreshToken({
            sub: sessionEntity.account.id,
            jti: sessionEntity.id,
        });
        const newRefreshTokenHash = this.cryptoService.hashToken(newRefreshToken);

        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: () => {
                sessionEntity.refresh(newRefreshTokenHash);
            },
        });

        const accessToken = await this.jwtService.signAccessToken({
            sub: sessionEntity.account.id,
            jti: sessionEntity.id,
        });

        return { accessToken, refreshToken: newRefreshToken, session: sessionEntity.id };
    }

    public async logout(props: Handlers.Session.Logout): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const sessionEntity = await this.sessionRepository.findUniqueOrThrow({
                    where: { id: props.input.session },
                    transaction,
                });

                this.sessionService.revoke({
                    input: { session: sessionEntity },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.LOGGED_OUT` };
    }

    public async logoutAll(props: Handlers.Session.LogoutAll): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: props.input.account },
                    transaction,
                });

                this.sessionService.revokeAll({
                    input: { account: accountEntity },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.ALL_SESSIONS_REVOKED` };
    }

    public async revoke(props: Handlers.Session.Revoke): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const sessionEntity = await this.sessionRepository.findUniqueOrThrow({
                    where: { id: props.input.session, account: props.input.account },
                    transaction,
                });

                this.sessionService.revoke({
                    input: { session: sessionEntity },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.SESSION_REVOKED` };
    }

    public async forceLogout(props: Handlers.Session.ForceLogout): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: props.input.account },
                    transaction,
                });

                this.sessionService.forceLogout({
                    input: {
                        account: accountEntity,
                        reason: props.input.reason,
                        actor: props.actor,
                    },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.FORCE_LOGOUT_COMPLETE` };
    }
}
