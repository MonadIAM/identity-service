import { beforeAll, beforeEach, afterAll, describe, expect, it } from "@jest/globals";
import Redis from "ioredis";

import { IssueCodeFixture } from "~testing/integration/scripts/issue-code.fixture";
import { RedisResource } from "~testing/integration/containers/redis.resource";
import { RedisConfig } from "~infrastructure/redis/redis.config";
import { AuthenticationContextClass, CodeChallengeMethod } from "~context/enums";

describe("[Lua] - issue-code", () => {
    let redis: Redis;
    let fixture: IssueCodeFixture;
    const request: Scripts.IssueCode.Request = {
        codeChallengeMethod: CodeChallengeMethod.S256,
        codeChallenge: "challenge",
        redirectUri: "https://client.example/callback",
        client: "client",
        state: "state",
        scope: "openid profile",
        nonce: "nonce",
    };
    const props: Scripts.IssueCode.Props = {
        account: "account",
        acr: AuthenticationContextClass.PASSWORD,
        ttl: 60,
    };

    beforeAll(async () => {
        redis = new Redis(RedisConfig.buildCacheOptions(RedisResource.config()));
        await redis.connect();
        fixture = new IssueCodeFixture(redis);
        await fixture.load();
    });

    beforeEach(async () => {
        await redis.flushdb();
        await redis.set(fixture.requestKey, JSON.stringify(request), "EX", 60);
    });

    afterAll(async () => {
        await redis?.quit();
    });

    it("[case] - issues a code with expiration and consumes its authorization request", async () => {
        // Act
        const result = await fixture.issue(props);

        // Assert
        expect(result).toEqual({ status: "issued", request });
        expect(await fixture.code()).toEqual({
            codeChallengeMethod: request.codeChallengeMethod,
            codeChallenge: request.codeChallenge,
            redirectUri: request.redirectUri,
            client: request.client,
            scope: request.scope,
            nonce: request.nonce,
            account: props.account,
            acr: props.acr,
        });
        expect(await redis.exists(fixture.requestKey)).toBe(0);
        expect(await redis.pttl(fixture.codeKey)).toBeGreaterThan(0);
        expect(await redis.pttl(fixture.codeKey)).toBeLessThanOrEqual(60000);
    });

    it("[case] - preserves both the request and an existing code on collision", async () => {
        // Arrange
        await redis.set(fixture.codeKey, "existing-code", "EX", 30);

        // Act
        const result = await fixture.issue(props);

        // Assert
        expect(result).toEqual({ status: "collision" });
        expect(await redis.get(fixture.codeKey)).toBe("existing-code");
        expect(await redis.get(fixture.requestKey)).toBe(JSON.stringify(request));
        expect(await redis.pttl(fixture.codeKey)).toBeLessThanOrEqual(30000);
    });

    it("[case] - does not issue a code for an expired request", async () => {
        // Arrange
        await redis.pexpire(fixture.requestKey, 0);

        // Act
        const result = await fixture.issue(props);

        // Assert
        expect(result).toEqual({ status: "missing" });
        expect(await fixture.code()).toBeNull();
    });

    it("[case] - allows only one of two concurrent issuances for a request", async () => {
        // Act
        const results = await Promise.all([fixture.issue(props), fixture.issue(props, "authorization:code:other")]);

        // Assert
        expect(results).toEqual(expect.arrayContaining([{ status: "issued", request }, { status: "missing" }]));
        expect(await redis.exists(fixture.codeKey, "authorization:code:other")).toBe(1);
        expect(await redis.exists(fixture.requestKey)).toBe(0);
    });

    it("[case] - leaves a malformed request intact when decoding fails", async () => {
        // Arrange
        await redis.set(fixture.requestKey, "invalid-json");

        // Act
        const result = fixture.issue(props);

        // Assert
        await expect(result).rejects.toThrow();
        expect(await redis.get(fixture.requestKey)).toBe("invalid-json");
        expect(await fixture.code()).toBeNull();
    });

    it("[case] - leaves the request available when the code TTL is invalid", async () => {
        // Act
        const result = fixture.issue({ ...props, ttl: 0 });

        // Assert
        await expect(result).rejects.toThrow("invalid expire time");
        expect(await redis.get(fixture.requestKey)).toBe(JSON.stringify(request));
        expect(await fixture.code()).toBeNull();
    });

    it("[case] - supports a request without an optional nonce", async () => {
        // Arrange
        const { nonce: _nonce, ...withoutNonce } = request;
        await redis.set(fixture.requestKey, JSON.stringify(withoutNonce));

        // Act
        const result = await fixture.issue(props);

        // Assert
        expect(result).toEqual({ status: "issued", request: withoutNonce });
        expect(await fixture.code()).not.toHaveProperty("nonce");
    });
});
