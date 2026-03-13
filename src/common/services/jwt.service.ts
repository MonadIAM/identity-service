import { SignJWT, jwtVerify, JWTPayload, importPKCS8, importSPKI, CryptoKey } from "jose";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWTService.Contract {
    private readonly issuer: string;
    private readonly accessTTL: string;
    private readonly refreshTTL: string;

    private privateKey!: CryptoKey;
    private publicKey!: CryptoKey;

    public constructor(private readonly config: ConfigService) {
        this.refreshTTL = this.config.getOrThrow<string>("JWT_REFRESH_TTL");
        this.accessTTL = this.config.getOrThrow<string>("JWT_ACCESS_TTL");
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
    }

    public async initialize(): Promise<void> {
        this.privateKey = await importPKCS8(this.config.getOrThrow<string>("JWT_PRIVATE_KEY"), "ES256");

        this.publicKey = await importSPKI(this.config.getOrThrow<string>("JWT_PUBLIC_KEY"), "ES256");
    }

    public signAccessToken(payload: Record<string, unknown>): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "ES256" })
            .setIssuer(this.issuer)
            .setSubject(payload.sub as string)
            .setIssuedAt()
            .setExpirationTime(this.accessTTL)
            .sign(this.privateKey);
    }

    public signRefreshToken(payload: Record<string, unknown>): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "ES256" })
            .setIssuer(this.issuer)
            .setSubject(payload.sub as string)
            .setIssuedAt()
            .setExpirationTime(this.refreshTTL)
            .sign(this.privateKey);
    }

    public async verify(token: string): Promise<JWTPayload> {
        return (
            await jwtVerify(token, this.publicKey, {
                issuer: this.issuer,
            })
        ).payload;
    }
}
