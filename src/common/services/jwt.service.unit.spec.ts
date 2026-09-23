import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import * as jose from "jose";

import { ErrorCode } from "~common/exceptions";

import { JWTService } from "./jwt.service";

const issuer = "https://issuer.example";
const claims = { client_id: "client", sub: "subject", sid: "session", realms: ["realm"] };

describe("JWTService with Vault keys", () => {
    let service: JWTService;
    let keys: Awaited<ReturnType<typeof jose.generateKeyPair>>;
    let publicKey: string;
    const getKey = jest.fn<CommonServices.VaultTransit.GetKey.Signature>();
    const sign = jest.fn<CommonServices.VaultTransit.Sign.Signature>();
    const hmac = jest.fn<CommonServices.VaultTransit.Hmac.Signature>();

    beforeAll(async () => {
        keys = await jose.generateKeyPair("ES256", { extractable: true });
        publicKey = await jose.exportSPKI(keys.publicKey);
    });

    beforeEach(() => {
        getKey.mockReset().mockImplementation(({ name }) =>
            Promise.resolve({
                name,
                type: "ecdsa-p256",
                latestVersion: 1,
                versions: [{ version: 1, publicKey, createdAt: new Date().toISOString() }],
            }),
        );
        sign.mockReset().mockImplementation(async ({ input, version }) => {
            const [header, payload] = input.split(".");
            const token = await new jose.CompactSign(Buffer.from(payload, "base64url"))
                .setProtectedHeader(JSON.parse(Buffer.from(header, "base64url").toString()))
                .sign(keys.privateKey);
            return { version: version ?? 1, signature: token.split(".")[2] };
        });
        service = new JWTService(
            { getKey, sign, hmac } as unknown as CommonServices.VaultTransit.Contract,
            new ConfigService({
                JWT_ISSUER: issuer,
                JWT_ACCESS_TTL: "15m",
                JWT_REFRESH_TTL: "1d",
                JWT_ID_TOKEN_TTL: "5m",
                VAULT_TRANSIT_ACCESS_KEY: "access",
                VAULT_TRANSIT_REFRESH_KEY: "refresh",
                VAULT_TRANSIT_ID_KEY: "id",
                VAULT_TRANSIT_PAIRWISE_KEY: "pairwise",
            }),
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        { kind: "access", type: "at+jwt", audience: `${issuer}:api`, ttl: 900 },
        { kind: "refresh", type: "rt+jwt", audience: `${issuer}:authn`, ttl: 86400 },
    ] as const)("signs and verifies a real $kind token", async ({ kind, type, audience, ttl }) => {
        const payload = { ...claims, jti: "stable-id" };

        const token =
            kind === "access" ? await service.signAccessToken({ payload }) : await service.signRefreshToken({ payload });
        const verified = kind === "access" ? await service.verifyAccess({ token }) : await service.verifyRefresh({ token });

        expect(verified).toMatchObject({ ...payload, iss: issuer, aud: audience });
        expect(verified.exp! - verified.iat!).toBe(ttl);
        expect(jose.decodeProtectedHeader(token)).toMatchObject({ alg: "ES256", typ: type, kid: expect.any(String) });
        expect(sign).toHaveBeenCalledWith(expect.objectContaining({ name: kind, version: 1 }));
    });

    it("signs an ID token with client audience and the access-token hash", async () => {
        const accessToken = "access-token";
        const expectedHash = jose.base64url.encode(
            createHash("sha256").update(accessToken, "ascii").digest().subarray(0, 16),
        );

        const token = await service.signIdToken({ payload: claims, props: { accessToken, audience: "client" } });
        const verified = await service.verifyIdToken({ token });

        expect(verified).toMatchObject({ sub: claims.sub, aud: "client", at_hash: expectedHash, jti: expect.any(String) });
        expect(jose.decodeProtectedHeader(token).typ).toBe("JWT");
    });

    it.each(["client_id", "sub", "sid", "realms", "exp", "iat", "jti"])("requires access claim %s", async (claim) => {
        const valid = await service.signAccessToken({ payload: claims });
        const payload = jose.decodeJwt<jose.JWTPayload>(valid);
        delete payload[claim];
        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ ...jose.decodeProtectedHeader(valid), alg: "ES256" })
            .sign(keys.privateKey);

        await expect(service.verifyAccess({ token })).rejects.toMatchObject({
            statusCode: 401,
            messageKey: "services.jwt.ACCESS_TOKEN_INVALID_CLAIMS",
            params: { claim },
            headers: { "WWW-Authenticate": expect.stringContaining('Bearer error="invalid_token"') },
        });
    });

    it("classifies expired access tokens", async () => {
        const valid = await service.signAccessToken({ payload: claims });
        const token = await new jose.SignJWT({ ...jose.decodeJwt<jose.JWTPayload>(valid), exp: 1 })
            .setProtectedHeader({ ...jose.decodeProtectedHeader(valid), alg: "ES256" })
            .sign(keys.privateKey);

        await expect(service.verifyAccess({ token })).rejects.toMatchObject({
            statusCode: 401,
            messageKey: "services.jwt.ACCESS_TOKEN_EXPIRED",
        });
    });

    it("rejects a signature made by another key", async () => {
        const valid = await service.signAccessToken({ payload: claims });
        const other = await jose.generateKeyPair("ES256");
        const token = await new jose.SignJWT(jose.decodeJwt<jose.JWTPayload>(valid))
            .setProtectedHeader({ ...jose.decodeProtectedHeader(valid), alg: "ES256" })
            .sign(other.privateKey);

        await expect(service.verifyAccess({ token })).rejects.toMatchObject({
            statusCode: 401,
            messageKey: "services.jwt.ACCESS_TOKEN_INVALID_SIGNATURE",
        });
    });

    it("maps malformed refresh tokens to invalid_grant", async () => {
        await expect(service.verifyRefresh({ token: "invalid" })).rejects.toMatchObject({
            statusCode: 400,
            code: ErrorCode.INVALID_GRANT,
            messageKey: "services.jwt.REFRESH_TOKEN_MALFORMED",
        });
    });

    it("maps malformed ID tokens to invalid_request", async () => {
        await expect(service.verifyIdToken({ token: "invalid" })).rejects.toMatchObject({
            statusCode: 400,
            code: ErrorCode.INVALID_REQUEST,
        });
    });

    it("preserves the current contract for expired but correctly signed ID tokens", async () => {
        const valid = await service.signIdToken({ payload: claims, props: { accessToken: "access", audience: "client" } });
        const payload = { ...jose.decodeJwt<jose.JWTPayload>(valid), exp: 1 };
        const token = await new jose.SignJWT(payload)
            .setProtectedHeader({ ...jose.decodeProtectedHeader(valid), alg: "ES256" })
            .sign(keys.privateKey);

        const result = await service.verifyIdToken({ token });

        expect(result).toEqual(payload);
    });

    it("normalizes key retrieval failures", async () => {
        getKey.mockRejectedValueOnce(new Error("vault unavailable"));

        await expect(service.verifyAccess({ token: "invalid" })).rejects.toMatchObject({
            statusCode: 401,
            messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
        });
    });

    it("rejects signing when Vault does not return the latest version", async () => {
        getKey.mockResolvedValueOnce({ name: "access", type: "ecdsa-p256", latestVersion: 2, versions: [] });

        await expect(service.signAccessToken({ payload: claims })).rejects.toMatchObject({
            statusCode: 502,
            messageKey: "services.jwt.KEY_VERSION_UNAVAILABLE",
        });
        expect(sign).not.toHaveBeenCalled();
    });

    it("publishes only access and ID keys", async () => {
        const result = await service.getPublicJWKS();

        expect(getKey.mock.calls.map(([props]) => props.name)).toEqual(["access", "id"]);
        expect(result.keys).toHaveLength(2);
        expect(result.keys[0]).toMatchObject({ alg: "ES256", use: "sig", kid: expect.any(String) });
        expect(result.keys[0]).not.toHaveProperty("d");
    });

    it("derives a pairwise subject from the client and account", async () => {
        hmac.mockResolvedValueOnce(Buffer.from([255, 254]).toString("base64"));

        const result = await service.computePairwiseSubject({ client: "client", account: "account" });

        expect(result).toBe("__4");
        expect(hmac).toHaveBeenCalledWith({ name: "pairwise", input: "client:account" });
    });

    it("expires old verification keys at the successor creation boundary plus TTL and skew", () => {
        const now = Date.parse("2026-01-02T00:00:00Z");
        jest.spyOn(Date, "now").mockReturnValue(now);
        const versions = [
            { version: 3, publicKey, createdAt: new Date(now - 1000).toISOString() },
            { version: 1, publicKey, createdAt: new Date(now - 2000000).toISOString() },
            { version: 2, publicKey, createdAt: new Date(now - 1200000).toISOString() },
        ];

        const result = service.selectVerifiableVersions({
            key: { name: "access", type: "ecdsa-p256", latestVersion: 3, versions },
        });
        const unknown = service.selectVerifiableVersions({
            key: { name: "other", type: "ecdsa-p256", latestVersion: 3, versions },
        });

        expect(result.map(({ version }) => version)).toEqual([2, 3]);
        expect(unknown.map(({ version }) => version)).toEqual([1, 2, 3]);
        expect(versions.map(({ version }) => version)).toEqual([3, 1, 2]);
    });

    it("prunes removed cache versions only for the selected key", async () => {
        const keyVersion = { version: 1, publicKey, createdAt: new Date().toISOString() };
        const cached = await service.describeKeyVersion({ name: "access", keyVersion });
        const other = await service.describeKeyVersion({ name: "id", keyVersion });

        service.pruneJWKCache({ name: "access", versions: [] });
        const refreshed = await service.describeKeyVersion({ name: "access", keyVersion });
        const retained = await service.describeKeyVersion({ name: "id", keyVersion });

        expect(refreshed).toEqual(cached);
        expect(refreshed).not.toBe(cached);
        expect(retained).toBe(other);
    });
});
