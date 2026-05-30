import { SignJWT, jwtVerify, importPKCS8, importSPKI, exportJWK, JWTPayload, calculateJwkThumbprint } from "jose";
import { Injectable, OnModuleInit, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import ms, { StringValue } from "ms";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract, OnModuleInit {
    declare private signingKey: CommonServices.JWT.SigningKey;

    private readonly refreshTTL: number;
    private readonly accessTTL: number;
    private readonly issuer: string;

    private readonly algorithm = "ES256";

    public constructor(private readonly config: ConfigService) {
        this.refreshTTL = ms(this.config.getOrThrow<StringValue>("JWT_REFRESH_TTL"));
        this.accessTTL = ms(this.config.getOrThrow<StringValue>("JWT_ACCESS_TTL"));
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
    }

    public async onModuleInit(): Promise<void> {
        const rawPrivate = this.config.getOrThrow<string>("JWT_PRIVATE_KEY").replace(/\\n/g, "\n");
        const rawPublic = this.config.getOrThrow<string>("JWT_PUBLIC_KEY").replace(/\\n/g, "\n");

        const publicKey = await importSPKI(rawPublic, this.algorithm);

        this.signingKey = {
            kid: await calculateJwkThumbprint(await exportJWK(publicKey), "sha256"),
            privateKey: await importPKCS8(rawPrivate, this.algorithm),
            publicKey,
        };
    }

    public signAccessToken(payload: JWTPayload): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({
                kid: this.signingKey.kid,
                alg: this.algorithm,
            })
            .setIssuer(this.issuer)
            .setSubject(payload.sub!)
            .setJti(payload.jti ?? randomUUID())
            .setIssuedAt()
            .setExpirationTime(this.accessTTL)
            .sign(this.signingKey.privateKey);
    }

    public signRefreshToken(payload: JWTPayload): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({
                kid: this.signingKey.kid,
                alg: this.algorithm,
            })
            .setIssuer(this.issuer)
            .setSubject(payload.sub!)
            .setJti(payload.jti ?? randomUUID())
            .setIssuedAt()
            .setExpirationTime(this.refreshTTL)
            .sign(this.signingKey.privateKey);
    }

    public async verify(token: string): Promise<JWTPayload> {
        const { payload } = await jwtVerify(token, this.signingKey.publicKey, {
            issuer: this.issuer,
        });
        return payload;
    }

    public async verifyIgnoringExpiry(token: string): Promise<JWTPayload> {
        const { payload } = await jwtVerify(token, this.signingKey.publicKey, {
            clockTolerance: Number.MAX_SAFE_INTEGER,
            issuer: this.issuer,
        });
        return payload;
    }

    public async getJWKS(): Promise<CommonServices.JWT.GetJWKS> {
        const jwk = await exportJWK(this.signingKey.publicKey);
        return {
            keys: [
                {
                    ...jwk,
                    kid: this.signingKey.kid,
                    alg: this.algorithm,
                    use: "sig",
                },
            ],
        };
    }
}
