import { SignJWT, jwtVerify, JWTPayload, importPKCS8, importSPKI, CryptoKey } from "jose";
import { Injectable, OnModuleInit, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract, OnModuleInit {
    private readonly issuer: string;
    private readonly accessTTL: string;
    private readonly refreshTTL: string;

    declare public privateKey: CryptoKey;
    declare public publicKey: CryptoKey;

    public constructor(private readonly config: ConfigService) {
        this.refreshTTL = this.config.getOrThrow<string>("JWT_REFRESH_TTL");
        this.accessTTL = this.config.getOrThrow<string>("JWT_ACCESS_TTL");
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
    }

    public async onModuleInit(): Promise<void> {
        const rawPrivate = this.config.getOrThrow<string>("JWT_PRIVATE_KEY").replace(/\\n/g, "\n");
        const rawPublic = this.config.getOrThrow<string>("JWT_PUBLIC_KEY").replace(/\\n/g, "\n");

        this.privateKey = await importPKCS8(rawPrivate, "ES256");
        this.publicKey = await importSPKI(rawPublic, "ES256");
    }

    public signAccessToken(payload: JWTPayload): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "ES256" })
            .setIssuer(this.issuer)
            .setSubject(payload.sub!)
            .setJti(payload.jti!)
            .setIssuedAt()
            .setExpirationTime(this.accessTTL)
            .sign(this.privateKey);
    }

    public signRefreshToken(payload: JWTPayload): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "ES256" })
            .setIssuer(this.issuer)
            .setSubject(payload.sub!)
            .setJti(payload.jti!)
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

    public async decode(token: string): Promise<JWTPayload> {
        return (
            await jwtVerify(token, this.publicKey, {
                clockTolerance: Number.MAX_SAFE_INTEGER,
                issuer: this.issuer,
            })
        ).payload;
    }
}
