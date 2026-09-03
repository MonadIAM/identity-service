import { base64url, calculateJwkThumbprint, createLocalJWKSet, errors, exportJWK, importSPKI, jwtVerify, JWK } from "jose";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { randomUUID, createHash } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { ErrorCode, Exception } from "~common/exceptions";

import { VAULT_TRANSIT_SERVICE } from "./tokens";

@Injectable({ scope: Scope.DEFAULT })
export class JWTService implements CommonServices.JWT.Contract {
    private readonly dictionaryPath = "services.jwt";

    private readonly refreshKey: string;
    private readonly accessKey: string;
    private readonly idKey: string;
    private readonly pairwiseKey: string;

    private readonly refreshAudience: string;
    private readonly accessAudience: string;
    private readonly refreshTTL: number;
    private readonly accessTTL: number;
    private readonly idTTL: number;
    private readonly issuer: string;

    private readonly jwkCache = new Map<string, JWK>();
    private readonly keyTTL = new Map<string, number>();

    private readonly clockSkew = ms("5m");
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
        this.idTTL = ms(this.config.getOrThrow<StringValue>("JWT_ID_TOKEN_TTL"));
        this.idKey = this.config.getOrThrow<string>("VAULT_TRANSIT_ID_KEY");
        this.pairwiseKey = this.config.getOrThrow<string>("VAULT_TRANSIT_PAIRWISE_KEY");
        this.issuer = this.config.getOrThrow<string>("JWT_ISSUER");
        this.refreshAudience = `${this.issuer}:authn`;
        this.accessAudience = `${this.issuer}:api`;

        this.keyTTL.set(this.refreshKey, this.refreshTTL);
        this.keyTTL.set(this.accessKey, this.accessTTL);
        this.keyTTL.set(this.idKey, this.idTTL);
    }

    public async computePairwiseSubject(
        props: CommonServices.JWT.ComputePairwiseSubject.Props,
    ): CommonServices.JWT.ComputePairwiseSubject.Result {
        const digest = await this.vaultTransitService.hmac({
            input: `${props.client}:${props.account}`,
            name: this.pairwiseKey,
        });

        return base64url.encode(Buffer.from(digest, "base64"));
    }

    public signRefreshToken(props: CommonServices.JWT.SignRefreshToken.Props): CommonServices.JWT.SignRefreshToken.Result {
        return this.sign({
            payload: props.payload,
            props: {
                audience: this.refreshAudience,
                key: this.refreshKey,
                ttl: this.refreshTTL,
                type: "rt+jwt",
            },
        });
    }

    public signAccessToken(props: CommonServices.JWT.SignAccessToken.Props): CommonServices.JWT.SignAccessToken.Result {
        return this.sign({
            payload: props.payload,
            props: {
                audience: this.accessAudience,
                key: this.accessKey,
                ttl: this.accessTTL,
                type: "at+jwt",
            },
        });
    }

    public signIdToken(props: CommonServices.JWT.SignIdToken.Props): CommonServices.JWT.SignIdToken.Result {
        const {
            props: { accessToken, audience },
            payload,
        } = props;

        const digest = createHash("sha256").update(accessToken, "ascii").digest();

        return this.sign({
            payload: {
                at_hash: base64url.encode(digest.subarray(0, digest.length / 2)),
                ...payload,
            },
            props: {
                key: this.idKey,
                ttl: this.idTTL,
                type: "JWT",
                audience,
            },
        });
    }

    public async verifyRefresh(props: CommonServices.JWT.VerifyToken.Props): CommonServices.JWT.VerifyToken.Result {
        try {
            const jwks = createLocalJWKSet(await this.getVerificationJWKS(this.refreshKey));
            const { payload } = await jwtVerify(props.token, jwks, {
                requiredClaims: ["client_id", "sub", "sid", "realms", "exp", "iat", "jti"],
                audience: this.refreshAudience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "rt+jwt",
            });

            return payload;
        } catch (error) {
            const { messageKey, params } = this.resolveVerificationFailure({ tokenType: "REFRESH", error });
            throw Exception.unauthorized({ messageKey, params });
        }
    }

    public async verifyAccess(props: CommonServices.JWT.VerifyToken.Props): CommonServices.JWT.VerifyToken.Result {
        try {
            const jwks = createLocalJWKSet(await this.getVerificationJWKS(this.accessKey));
            const { payload } = await jwtVerify(props.token, jwks, {
                requiredClaims: ["client_id", "sub", "sid", "realms", "exp", "iat", "jti"],
                audience: this.accessAudience,
                algorithms: [this.algorithm],
                issuer: this.issuer,
                typ: "at+jwt",
            });

            return payload;
        } catch (error) {
            const { messageKey, description, params } = this.resolveVerificationFailure({ tokenType: "ACCESS", error });
            throw Exception.unauthorized({
                headers: {
                    "WWW-Authenticate": `Bearer error="invalid_token", error_description="${description}"`,
                },
                messageKey,
                params,
            });
        }
    }

    public async verifyIdToken(props: CommonServices.JWT.VerifyToken.Props): CommonServices.JWT.VerifyToken.Result {
        try {
            const jwks = createLocalJWKSet(await this.getVerificationJWKS(this.idKey));
            const { payload } = await jwtVerify(props.token, jwks, {
                requiredClaims: ["sub", "sid", "aud", "exp", "iat"],
                algorithms: [this.algorithm],
                issuer: this.issuer,
            });

            return payload;
        } catch (error) {
            if (error instanceof errors.JWTExpired) {
                return error.payload;
            }

            const { messageKey } = this.resolveVerificationFailure({ tokenType: "ID", error });
            throw Exception.badRequest({ messageKey, code: ErrorCode.INVALID_REQUEST });
        }
    }

    public async getPublicJWKS(): CommonServices.JWT.GetPublicJWKS.Result {
        const sets = await Promise.all([this.accessKey, this.idKey].map((name) => this.getVerificationJWKS(name)));

        return { keys: sets.flatMap(({ keys }) => keys) };
    }

    public resolveVerificationFailure(
        props: CommonServices.JWT.ResolveVerificationFailure.Props,
    ): CommonServices.JWT.ResolveVerificationFailure.Result {
        const { tokenType, error } = props;
        const { prefix, label } = (
            {
                REFRESH: { prefix: "REFRESH_TOKEN", label: "refresh" },
                ACCESS: { prefix: "ACCESS_TOKEN", label: "access" },
                ID: { prefix: "ID_TOKEN", label: "id" },
            } as const
        )[tokenType];

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

    public selectVerifiableVersions(
        props: CommonServices.JWT.SelectVerifiableVersions.Props,
    ): CommonServices.JWT.SelectVerifiableVersions.Result {
        const ttl = this.keyTTL.get(props.key.name) ?? Number.POSITIVE_INFINITY;
        const versions = [...props.key.versions].sort((left, right) => left.version - right.version);
        const deadline = Date.now() - ttl - this.clockSkew;

        return versions.filter((version, index) => {
            const successor = versions[index + 1];

            return !successor || version.version === props.key.latestVersion || Date.parse(successor.createdAt) > deadline;
        });
    }

    public async getVerificationJWKS(
        props: CommonServices.JWT.GetVerificationJWKS.Props,
    ): CommonServices.JWT.GetVerificationJWKS.Result {
        const key = await this.vaultTransitService.getKey({ name: props });
        const versions = this.selectVerifiableVersions({ key });

        this.pruneJWKCache({ versions: key.versions, name: props });

        return {
            keys: await Promise.all(versions.map((keyVersion) => this.describeKeyVersion({ name: props, keyVersion }))),
        };
    }

    public async describeKeyVersion(
        props: CommonServices.JWT.DescribeKeyVersion.Props,
    ): CommonServices.JWT.DescribeKeyVersion.Result {
        const { keyVersion, name } = props;
        const cacheKey = `${name}:v${keyVersion.version}`;
        const cached = this.jwkCache.get(cacheKey);

        if (cached) {
            return cached;
        } else {
            const jwk = await exportJWK(await importSPKI(keyVersion.publicKey, this.algorithm));
            const entry: JWK = {
                ...jwk,
                kid: await calculateJwkThumbprint(jwk, "sha256"),
                alg: this.algorithm,
                use: "sig",
            };

            this.jwkCache.set(cacheKey, entry);

            return entry;
        }
    }

    public pruneJWKCache(props: CommonServices.JWT.PruneJWKCache.Props): CommonServices.JWT.PruneJWKCache.Result {
        const prefix = `${props.name}:v`;
        const live = new Set(props.versions.map(({ version }) => `${prefix}${version}`));

        for (const cacheKey of this.jwkCache.keys()) {
            if (cacheKey.startsWith(prefix) && !live.has(cacheKey)) {
                this.jwkCache.delete(cacheKey);
            }
        }
    }

    public async sign({ payload, props }: CommonServices.JWT.Sign.Props): CommonServices.JWT.Sign.Result {
        const key = await this.vaultTransitService.getKey({ name: props.key });
        const now = Math.floor(Date.now() / 1e3);
        const version = key.latestVersion;

        const latest = key.versions.find((candidate) => candidate.version === version);
        if (!latest) {
            throw Exception.externalServiceFailed({ messageKey: `${this.dictionaryPath}.KEY_VERSION_UNAVAILABLE` });
        }

        this.pruneJWKCache({ versions: key.versions, name: props.key });

        const { kid } = await this.describeKeyVersion({ name: props.key, keyVersion: latest });

        const header = base64url.encode(
            JSON.stringify({
                alg: this.algorithm,
                typ: props.type,
                kid,
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
}
