import { base64url, createLocalJWKSet, errors, exportJWK, importSPKI, jwtVerify, JWTPayload } from "jose";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import ms, { StringValue } from "ms";

import { Exception } from "~common/exceptions";

import { VAULT_TRANSIT_SERVICE } from "./tokens";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract {
    private readonly dictionaryPath = "services.jwt";

    private readonly refreshKey: string;
    private readonly accessKey: string;

    private readonly refreshAudience: string;
    private readonly accessAudience: string;
    private readonly refreshTTL: number;
    private readonly accessTTL: number;
    private readonly issuer: string;

    private readonly algorithm = "ES256";

    public constructor(
        @Inject(VAULT_TRANSIT_SERVICE)
        private readonly vaultTransitService: CommonServices.VaultTransit.Contract,
        private readonly config: ConfigService,
    ) {
        this.refreshKey = this.config.getOrThrow<string>("VAULT_TRANSIT_REFRESH_KEY");
        this.accessKey = this.config.getOrThrow<string>("VAULT_TRANSIT_ACCESS_KEY");
        this.refreshTTL = ms(this.config.getOrThrow<StringValue>("JWT_REFRESH_TTL"));
        this.accessTTL = ms(this.config.getOrThrow<StringValue>("JWT_ACCESS_TTL"));
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
        this.refreshAudience = `${this.issuer}:authn`;
        this.accessAudience = `${this.issuer}:api`;
    }

    public signAccessToken(payload: JWTPayload): Promise<string> {
        return this.sign(payload, {
            audience: this.accessAudience,
            key: this.accessKey,
            ttl: this.accessTTL,
            type: "at+jwt",
        });
    }

    public async verifyAccess(token: string): Promise<JWTPayload> {
        try {
            const { payload } = await jwtVerify(token, createLocalJWKSet(await this.getJWKS(this.accessKey)), {
                requiredClaims: ["client_id", "sub", "sid", "realms", "exp", "iat", "jti"],
                audience: this.accessAudience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "at+jwt",
            });

            return payload;
        } catch (error) {
            const { messageKey, description, params } = this.resolveVerificationFailure(error, "ACCESS");
            throw Exception.unauthorized({
                headers: {
                    "WWW-Authenticate": `Bearer error="invalid_token", error_description="${description}"`,
                },
                messageKey,
                params,
            });
        }
    }

    public signRefreshToken(payload: JWTPayload): Promise<string> {
        return this.sign(payload, {
            audience: this.refreshAudience,
            key: this.refreshKey,
            ttl: this.refreshTTL,
            type: "rt+jwt",
        });
    }

    public async verifyRefresh(token: string): Promise<JWTPayload> {
        try {
            const { payload } = await jwtVerify(token, createLocalJWKSet(await this.getJWKS(this.refreshKey)), {
                requiredClaims: ["client_id", "sub", "sid", "realms", "exp", "iat", "jti"],
                audience: this.refreshAudience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "rt+jwt",
            });

            return payload;
        } catch (error) {
            const { messageKey, params } = this.resolveVerificationFailure(error, "REFRESH");
            throw Exception.unauthorized({ messageKey, params });
        }
    }

    public async getJWKS(name = this.accessKey): Promise<CommonServices.JWT.GetJWKS> {
        const key = await this.vaultTransitService.getKey({ name });
        const keys = await Promise.all(
            key.versions.map(async ({ publicKey, version }) => ({
                ...(await exportJWK(await importSPKI(publicKey, this.algorithm))),
                kid: `${name}:v${version}`,
                alg: this.algorithm,
                use: "sig",
            })),
        );

        return { keys };
    }

    public async sign(payload: JWTPayload, props: CommonServices.JWT.Sign.Props): Promise<string> {
        const key = await this.vaultTransitService.getKey({ name: props.key });
        const now = Math.floor(Date.now() / 1e3);
        const version = key.latestVersion;

        const header = base64url.encode(
            JSON.stringify({
                kid: `${props.key}:v${version}`,
                alg: this.algorithm,
                typ: props.type,
            }),
        );

        const claims = base64url.encode(
            JSON.stringify({
                ...payload,
                exp: now + Math.ceil(props.ttl / 1e3),
                jti: payload.jti ?? randomUUID(),
                aud: props.audience,
                sub: payload.sub,
                iss: this.issuer,
                iat: now,
            }),
        );

        const input = `${header}.${claims}`;
        const { signature } = await this.vaultTransitService.sign({ input, version, name: props.key });

        return `${input}.${signature}`;
    }

    public resolveVerificationFailure(error: unknown, tokenType: "ACCESS" | "REFRESH"): CommonServices.JWT.Failure {
        const prefix = tokenType === "ACCESS" ? "ACCESS_TOKEN" : "REFRESH_TOKEN";
        const label = tokenType === "ACCESS" ? "access" : "refresh";

        switch (true) {
            case error instanceof errors.JWTExpired:
                return {
                    messageKey: `${this.dictionaryPath}.${prefix}_EXPIRED`,
                    description: `The ${label} token has expired`,
                };

            case error instanceof errors.JWSSignatureVerificationFailed:
            case error instanceof errors.JOSEAlgNotAllowed:
                return {
                    messageKey: `${this.dictionaryPath}.${prefix}_INVALID_SIGNATURE`,
                    description: `The ${label} token signature could not be verified`,
                };

            case error instanceof errors.JWTClaimValidationFailed:
                return {
                    messageKey: `${this.dictionaryPath}.${prefix}_INVALID_CLAIMS`,
                    params: { claim: error.claim },
                    description: `The ${label} token "${error.claim}" claim failed validation`,
                };

            case error instanceof errors.JWSInvalid:
            case error instanceof errors.JWTInvalid:
            case error instanceof errors.JWKSNoMatchingKey:
            case error instanceof errors.JWKSMultipleMatchingKeys:
                return {
                    messageKey: `${this.dictionaryPath}.${prefix}_MALFORMED`,
                    description: `The ${label} token is malformed`,
                };

            default:
                return {
                    messageKey: `${this.dictionaryPath}.INVALID_${prefix}`,
                    description: `The ${label} token is invalid`,
                };
        }
    }
}
