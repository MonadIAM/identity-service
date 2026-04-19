import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { Session } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SessionService implements Services.Session.Contract {
    private readonly sessionExpiryDays: number;

    public constructor(
        private readonly configService: ConfigService,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {
        this.sessionExpiryDays = this.configService.getOrThrow<number>("SESSION_EXPIRY_DAYS");
    }

    public async create({ transaction, input }: Services.Session.Create.Props): Promise<Services.Session.Create.Result> {
        const session = new Session({
            expiresAt: this.resolveExpiry(),
            userAgent: input.userAgent,
            account: input.account,
            ip: input.ip,
        });

        const refreshToken = await this.jwtService.signRefreshToken({
            sub: input.account.id,
            sid: session.id,
        });

        session.refresh(this.cryptoService.hashToken(refreshToken));

        transaction.persist(session);

        const accessToken = await this.jwtService.signAccessToken({
            sub: input.account.id,
            sid: session.id,
        });

        return { accessToken, refreshToken };
    }

    public purge({ transaction, input }: Services.Session.Purge): void {
        for (const session of input.sessions) {
            transaction.remove(session);
        }
    }

    private resolveExpiry(): Date {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + this.sessionExpiryDays);
        return expiry;
    }
}
