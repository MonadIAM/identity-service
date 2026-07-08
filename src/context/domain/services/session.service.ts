import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { SESSION_REPOSITORY } from "~context/infrastructure/repositories";
import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { Session } from "~context/domain/entities";

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
        private readonly sessionRepository: Repositories.Session.Contract,
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
            expiresAt: this.resolveExpiry(),
            userAgent: input.userAgent,
            account: input.account,
            client: input.client,
            realms: input.realms,
            ip: input.ip,
        });

        const refreshToken = await this.jwtService.signRefreshToken({
            client_id: session.client,
            sub: input.account.id,
            realms: input.realms,
            sid: session.id,
        });

        session.refresh(this.cryptoService.hashToken(refreshToken));

        transaction.persist(session);

        const accessToken = await this.jwtService.signAccessToken({
            client_id: session.client,
            sub: input.account.id,
            realms: input.realms,
            sid: session.id,
        });

        return {
            revokedSessions,
            refreshToken,
            accessToken,
        };
    }

    public purge(props: Services.Session.Purge.Props): Services.Session.Purge.Result {
        const { transaction, input } = props;
        for (const session of input.sessions) {
            transaction.remove(session);
        }
    }

    private resolveExpiry(): Date {
        const expiry = new Date(Number(new Date()) + this.sessionExpiryDays);
        return expiry;
    }
}
