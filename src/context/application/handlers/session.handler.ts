import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { SESSION_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SessionHandler implements Handlers.Session.Contract {
    private readonly dictionaryPath = "handlers.session";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
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

    public async refresh({
        input: { refreshToken, session },
    }: Handlers.Session.Refresh.Props): Promise<Handlers.Session.Refresh.Result> {
        try {
            const sessionEntity = await this.sessionRepository.findUnique({
                where: { id: session },
                options: { populate: ["account"] },
            });

            if (!sessionEntity) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.SESSION_NOT_FOUND`);
            }

            if (sessionEntity.expiresAt < new Date()) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.SESSION_EXPIRED`);
            }

            const tokenHash = this.cryptoService.hashToken(refreshToken);
            if (tokenHash !== sessionEntity.refreshTokenHash) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_REFRESH_TOKEN`);
            }

            const newRefreshToken = await this.jwtService.signRefreshToken({
                sub: sessionEntity.account.id,
                jti: sessionEntity.id,
            });
            const newRefreshTokenHash = this.cryptoService.hashToken(newRefreshToken);

            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                await this.sessionService.refresh({
                    input: { session: sessionEntity, hash: newRefreshTokenHash },
                    transaction,
                });
            });

            const accessToken = await this.jwtService.signAccessToken({
                sub: sessionEntity.account.id,
                jti: sessionEntity.id,
            });

            return { accessToken, refreshToken: newRefreshToken, session: sessionEntity.id };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async logout({ input: { session }, context }: Handlers.Session.Logout): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const sessionEntity = await this.sessionRepository.findUniqueOrThrow({
                    where: { id: session },
                    transaction,
                });

                await this.sessionService.revoke({
                    input: { session: sessionEntity },
                    context,
                    transaction,
                });
            });

            return { message: `${this.dictionaryPath}.LOGGED_OUT` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async logoutAll({ input: { account }, context }: Handlers.Session.LogoutAll): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: account },
                    transaction,
                });

                await this.sessionService.revokeAll({
                    input: { account: accountEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.ALL_SESSIONS_REVOKED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async revoke({ input: { account, session }, context }: Handlers.Session.Revoke): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const sessionEntity = await this.sessionRepository.findUniqueOrThrow({
                    where: { id: session, account },
                    transaction,
                });

                await this.sessionService.revoke({
                    input: { session: sessionEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.SESSION_REVOKED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async forceLogout({
        input: { account, reason },
        context,
        actor,
    }: Handlers.Session.ForceLogout): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: account },
                    transaction,
                });

                await this.sessionService.forceLogout({
                    input: { account: accountEntity, reason, actor },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.FORCE_LOGOUT_COMPLETE` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
