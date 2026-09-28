import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { GitHubOAuthService } from "./github-oauth.service";

const redirectUri = "https://app.example.test/callback?next=/home";
const service = new GitHubOAuthService(
    new ConfigService({
        OAUTH_GITHUB_CLIENT_ID: "client-id",
        OAUTH_GITHUB_CLIENT_SECRET: "test-secret",
        OAUTH_GITHUB_REDIRECT_URI: redirectUri,
    }),
);
const user = {
    id: 123,
    name: "Display Name",
    login: "login",
    avatar_url: "https://example.test/avatar",
    email: "untrusted@example.test",
};

describe("GitHubOAuthService", () => {
    let request: jest.SpiedFunction<typeof fetch>;

    beforeEach(() => {
        request = jest.spyOn(globalThis, "fetch");
        request.mockRejectedValue(new Error("Unexpected HTTP request"));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getAuthorizationUrl", () => {
        it("builds an authorization URL preserving state and redirect parameters", () => {
            const state = "opaque +&= state";

            const url = new URL(service.getAuthorizationUrl(state));

            expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
            expect(Object.fromEntries(url.searchParams)).toEqual({
                redirect_uri: redirectUri,
                client_id: "client-id",
                state,
                scope: "read:user user:email",
            });
            expect(request).not.toHaveBeenCalled();
        });
    });

    describe("exchangeCode", () => {
        it("exchanges the code using JSON and returns the provider tokens", async () => {
            const tokens = { access_token: "access", token_type: "bearer", scope: "read:user user:email" };
            request.mockResolvedValueOnce(Response.json(tokens));

            const result = await service.exchangeCode("code+&=");

            expect(result).toEqual(tokens);
            expect(request).toHaveBeenCalledWith("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    client_secret: "test-secret",
                    redirect_uri: redirectUri,
                    client_id: "client-id",
                    code: "code+&=",
                }),
            });
        });

        it("recognizes an OAuth error even when the HTTP status is successful", async () => {
            request.mockResolvedValueOnce(Response.json({ error: "bad_verification_code" }));

            await expect(service.exchangeCode("code")).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.oauth.github.CODE_EXCHANGE_FAILED",
            });
        });

        it.each([400, 503])("maps HTTP %s during exchange to an external service failure", async (status) => {
            request.mockResolvedValueOnce(new Response("upstream error", { status }));

            await expect(service.exchangeCode("code")).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.oauth.github.CODE_EXCHANGE_FAILED",
            });
        });

        it("maps a token exchange network error to an external service failure", async () => {
            const error = new Error("network unavailable");
            request.mockRejectedValueOnce(error);

            await expect(service.exchangeCode("code")).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.oauth.github.CODE_EXCHANGE_FAILED",
                cause: error,
            });
        });

        it("rejects malformed JSON from the token endpoint", async () => {
            request.mockResolvedValueOnce(new Response("not JSON"));

            await expect(service.exchangeCode("code")).rejects.toMatchObject({ name: "SyntaxError" });
        });
    });

    describe("fetchProfile", () => {
        it("selects only a primary verified email and maps the public profile", async () => {
            request.mockResolvedValueOnce(Response.json(user)).mockResolvedValueOnce(
                Response.json([
                    { email: "secondary@example.test", primary: false, verified: true },
                    { email: "unverified@example.test", primary: true, verified: false },
                    { email: "primary@example.test", primary: true, verified: true },
                ]),
            );

            const result = await service.fetchProfile("access-token");

            expect(result).toEqual({
                providerUserId: "123",
                displayName: "Display Name",
                pictureUrl: user.avatar_url,
                email: "primary@example.test",
                emailVerified: true,
            });
            expect(request).toHaveBeenCalledTimes(2);
            for (const url of ["https://api.github.com/user", "https://api.github.com/user/emails"]) {
                expect(request).toHaveBeenCalledWith(url, {
                    headers: { Authorization: "Bearer access-token", Accept: "application/vnd.github+json" },
                });
            }
        });

        it.each([null, undefined])(
            "falls back to the login when name is %s and does not trust the public email",
            async (name) => {
                request.mockResolvedValueOnce(Response.json({ ...user, name })).mockResolvedValueOnce(Response.json([]));

                const result = await service.fetchProfile("token");

                expect(result).toMatchObject({ displayName: "login", emailVerified: false });
                expect(result.email).toBeUndefined();
            },
        );

        it("returns a profile without email if the email endpoint refuses access", async () => {
            request
                .mockResolvedValueOnce(Response.json(user))
                .mockResolvedValueOnce(new Response("forbidden", { status: 403 }));

            const result = await service.fetchProfile("token");

            expect(result).toMatchObject({ providerUserId: "123", emailVerified: false });
            expect(result.email).toBeUndefined();
        });

        it("rejects the profile when the user endpoint fails", async () => {
            request
                .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
                .mockResolvedValueOnce(Response.json([]));

            await expect(service.fetchProfile("token")).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.oauth.github.PROFILE_FETCH_FAILED",
            });
        });

        it.each(["user", "emails"])(
            "maps a network failure from the %s endpoint to an external service failure",
            async (endpoint) => {
                const error = new Error("network unavailable");
                request.mockImplementation((url) => {
                    if (String(url) === `https://api.github.com/user${endpoint === "emails" ? "/emails" : ""}`) {
                        return Promise.reject(error);
                    }
                    return Promise.resolve(Response.json(endpoint === "emails" ? user : []));
                });

                await expect(service.fetchProfile("token")).rejects.toMatchObject({
                    statusCode: 502,
                    messageKey: "services.oauth.github.PROFILE_FETCH_FAILED",
                    cause: error,
                });
            },
        );
    });
});
