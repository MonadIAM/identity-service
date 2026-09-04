import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { SESSION_REPOSITORY } from "~context/infrastructure/repositories";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { OidcScope } from "~context/enums";

import { Session } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionService implements Services.Session.Contract {
    private readonly sessionExpiryDays: number;
    private readonly maxActiveSessions: number;
    private readonly accessTokenMaxTTL: number;

    public constructor(
        private readonly configService: ConfigService,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(SESSION_REPOSITORY)
        private readonly sessionRepository: Repositories.Session.PublicContract,
    ) {
        this.sessionExpiryDays = ms(this.configService.getOrThrow<StringValue>("SESSION_EXPIRY_DAYS")) / 1e3;
        this.accessTokenMaxTTL = ms(this.configService.getOrThrow<StringValue>("JWT_ACCESS_TTL")) / 1e3;
        this.maxActiveSessions = this.configService.getOrThrow<number>("SESSION_MAX_ACTIVE_COUNT");
    }

    public async create(props: Services.Session.Create.Props): Services.Session.Create.Result {
        const { transaction, input } = props;

        const sessions = await this.sessionRepository.lockByAccount({
            account: input.account.id,
            transaction,
        });

        const overflowedSessions: Entities.Session[] = [];

        if (sessions.length >= this.maxActiveSessions) {
            overflowedSessions.push(...sessions.slice(0, sessions.length - this.maxActiveSessions + 1));
            this.purge({
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
            account: input.account,
            client: input.client,
            realms: input.realms,
            scope: input.scope,
            acr: input.acr,
            ip: input.ip,
        });

        const refreshToken = await this.jwtService.signRefreshToken({
            payload: {
                client_id: session.client,
                sub: input.account.id,
                realms: input.realms,
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
                sub: input.account.id,
                realms: input.realms,
                acr: session.acr,
                sid: session.id,
            },
        });

        let idToken: Optional<string>;

        if (session.scope.split(" ").includes(OidcScope.OPENID)) {
            const sub = await this.jwtService.computePairwiseSubject({
                account: input.account.id,
                client: session.client,
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

    public purge(props: Services.Session.Purge.Props): Services.Session.Purge.Result {
        const { transaction, input } = props;
        for (const session of input.sessions) {
            transaction.remove(session);
        }
    }
}
