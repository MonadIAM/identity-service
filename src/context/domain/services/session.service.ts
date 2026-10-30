import { Inject, Injectable, Scope } from "@nestjs/common";
import { LockMode } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";
import { isString } from "class-validator";
import ms, { StringValue } from "ms";

import { SESSION_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { AccountStatus, OidcScope } from "~context/enums";
import { ErrorCode, Exception } from "~common/exceptions";

import { Session } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionService implements Services.Session.Contract {
    private readonly dictionaryPath = "services.session";
    private readonly sessionExpiryDays: number;
    private readonly maxActiveSessions: number;
    private readonly accessTokenMaxTTL: number;

    public constructor(
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
        private readonly configService: ConfigService,
    ) {
        this.sessionExpiryDays = ms(this.configService.getOrThrow<StringValue>("SESSION_EXPIRY_DAYS")) / 1e3;
        this.accessTokenMaxTTL = ms(this.configService.getOrThrow<StringValue>("JWT_ACCESS_TTL")) / 1e3;
        this.maxActiveSessions = this.configService.getOrThrow<number>("SESSION_MAX_ACTIVE_COUNT");
    }

    public async create(props: Services.Session.Create.Props): Services.Session.Create.Result {
        const { transaction, input } = props;
        const account = isString(input.account)
            ? await this.resolveAuthenticatable({ input: { account: input.account }, transaction })
            : input.account;

        const sessions = await this.sessionRepository.lockByAccount({
            account: account.id,
            transaction,
        });

        const overflowedSessions: Entities.Session[] = [];

        if (sessions.length >= this.maxActiveSessions) {
            overflowedSessions.push(...sessions.slice(0, sessions.length - this.maxActiveSessions + 1));
            await this.revoke({
                input: { sessions: overflowedSessions },
                transaction,
            });
        }

        const revokedSessions = overflowedSessions.map(({ id, lastRefreshedAt }) => ({
            expiresAt: Math.round(lastRefreshedAt.getTime() + this.accessTokenMaxTTL * 1e3),
            session: id,
        }));

        const session = new Session({
            expiresAt: new Date(Number(new Date()) + this.sessionExpiryDays * 1e3),
            userAgent: input.userAgent,
            client: input.client,
            realms: input.realms,
            scope: input.scope,
            acr: input.acr,
            ip: input.ip,
            account,
        });

        const refreshToken = await this.jwtService.signRefreshToken({
            payload: {
                client_id: session.client,
                realms: input.realms,
                sub: account.id,
                sid: session.id,
            },
        });

        session.refresh(this.cryptoService.hashToken({ token: refreshToken }));

        transaction.persist(session);

        const accessToken = await this.jwtService.signAccessToken({
            payload: {
                auth_time: Math.floor(session.createdAt.getTime() / 1e3),
                ...(session.scope ? { scope: session.scope } : {}),
                client_id: session.client,
                realms: input.realms,
                acr: session.acr,
                sub: account.id,
                sid: session.id,
            },
        });

        let idToken: Optional<string>;

        if (session.scope.split(" ").includes(OidcScope.OPENID)) {
            const sub = await this.jwtService.computePairwiseSubject({
                client: session.client,
                account: account.id,
            });

            idToken = await this.jwtService.signIdToken({
                payload: {
                    auth_time: Math.floor(session.createdAt.getTime() / 1e3),
                    ...(input.nonce ? { nonce: input.nonce } : {}),
                    acr: session.acr,
                    sid: session.id,
                    sub,
                },
                props: {
                    audience: session.client,
                    accessToken,
                },
            });
        }

        return {
            revokedSessions,
            refreshToken,
            accessToken,
            idToken,
        };
    }

    public async refresh(props: Services.Session.Refresh.Props): Services.Session.Refresh.Result {
        const { transaction, input } = props;
        const session = await this.sessionRepository.findUnique({
            options: { populate: ["account"], lockMode: LockMode.PESSIMISTIC_WRITE },
            where: { id: input.session },
            transaction,
        });

        if (!session) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.SESSION_NOT_FOUND`,
                code: ErrorCode.INVALID_GRANT,
            });
        }

        if (input.client !== session.client) {
            throw Exception.badRequest({
                messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN`,
                code: ErrorCode.INVALID_GRANT,
            });
        }

        session.isExpired();

        if (input.tokenHash === session.refreshTokenHash) {
            const refreshToken = await this.jwtService.signRefreshToken({
                payload: {
                    client_id: session.client,
                    sub: session.account.id,
                    realms: session.realms,
                    sid: session.id,
                },
            });

            session.refresh(this.cryptoService.hashToken({ token: refreshToken }));

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

            return { kind: "ROTATED", accessToken, refreshToken };
        } else {
            return { kind: "REUSE_DETECTED", session };
        }
    }

    public async revoke(props: Services.Session.Revoke.Props): Services.Session.Revoke.Result {
        const { transaction, input } = props;
        let sessions: Entities.Session[];

        if ("token" in input) {
            const session = await this.sessionRepository.findUnique({
                where: {
                    refreshTokenHash: this.cryptoService.hashToken({ token: input.token }),
                    account: input.account,
                },
                transaction,
            });

            sessions = session ? [session] : [];
        } else if ("current" in input) {
            sessions = await this.sessionRepository.find({
                where: {
                    id: input.sessions?.length ? { $in: input.sessions } : input.current,
                    account: input.account,
                },
                transaction,
            });
        } else {
            sessions = input.sessions;
        }

        for (const session of sessions) {
            transaction.remove(session);
        }

        return sessions;
    }

    public async revokeAll(props: Services.Session.RevokeAll.Props): Services.Session.RevokeAll.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["sessions"] },
            where: { id: input.account },
            transaction,
        });

        const sessions = account.sessions.getItems();

        for (const session of sessions) {
            transaction.remove(session);
        }

        return sessions;
    }

    public async resolveAuthenticatable(
        props: Services.Session.ResolveAuthenticatable.Props,
    ): Services.Session.ResolveAuthenticatable.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
            where: { id: input.account },
            transaction,
        });

        if (account.status === AccountStatus.SUSPENDED || account.status === AccountStatus.PENDING) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_AUTHENTICATABLE` });
        }

        if (account.status === AccountStatus.DEACTIVATED) {
            account.restore();
        }

        account.touch();

        return account;
    }
}
