import { SignJWT, jwtVerify, importPKCS8, importSPKI, exportJWK, JWTPayload, calculateJwkThumbprint } from "jose";
import { Injectable, OnModuleInit, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import ms, { StringValue } from "ms";

import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract, OnModuleInit {
    private readonly dictionaryPath = "services.jwt";

    declare private signingKey: CommonServices.JWT.SigningKey;

    private readonly refreshAudience: string;
    private readonly accessAudience: string;
    private readonly refreshTTL: number;
    private readonly accessTTL: number;
    private readonly issuer: string;

    private readonly algorithm = "ES256";

    public constructor(private readonly config: ConfigService) {
        this.refreshTTL = ms(this.config.getOrThrow<StringValue>("JWT_REFRESH_TTL"));
        this.accessTTL = ms(this.config.getOrThrow<StringValue>("JWT_ACCESS_TTL"));
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
        this.refreshAudience = `${this.issuer}:authn`;
        this.accessAudience = `${this.issuer}:api`;
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
                typ: "at+jwt",
            })
            .setAudience(this.accessAudience)
            .setIssuer(this.issuer)
            .setSubject(payload.sub!)
            .setJti(payload.jti ?? randomUUID())
            .setIssuedAt()
            .setExpirationTime(this.accessTTL)
            .sign(this.signingKey.privateKey);
    }

    public async verifyAccess(token: string): Promise<JWTPayload> {
        try {
            const { payload } = await jwtVerify(token, this.signingKey.publicKey, {
                requiredClaims: ["sub", "sid", "exp", "iat", "jti"],
                audience: this.accessAudience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "at+jwt",
            });

            return payload;
        } catch {
            throw Exception.unauthorized({
                messageKey: `${this.dictionaryPath}.INVALID_ACCESS_TOKEN`,
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        }
    }

    public signRefreshToken(payload: JWTPayload): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({
                kid: this.signingKey.kid,
                alg: this.algorithm,
                typ: "rt+jwt",
            })
            .setAudience(this.refreshAudience)
            .setIssuer(this.issuer)
            .setSubject(payload.sub!)
            .setJti(payload.jti ?? randomUUID())
            .setIssuedAt()
            .setExpirationTime(this.refreshTTL)
            .sign(this.signingKey.privateKey);
    }

    public async verifyRefresh(token: string): Promise<JWTPayload> {
        try {
            const { payload } = await jwtVerify(token, this.signingKey.publicKey, {
                requiredClaims: ["sub", "sid", "exp", "iat", "jti"],
                audience: this.refreshAudience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "rt+jwt",
            });

            return payload;
        } catch {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_REFRESH_TOKEN` });
        }
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
