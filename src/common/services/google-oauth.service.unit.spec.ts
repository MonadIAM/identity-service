import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { GoogleOAuthService } from "./google-oauth.service";

const redirectUri = "https://app.example.test/callback?next=/home";
const service = new GoogleOAuthService(
    new ConfigService({
        OAUTH_GOOGLE_CLIENT_ID: "client-id",
        OAUTH_GOOGLE_CLIENT_SECRET: "test-secret",
        OAUTH_GOOGLE_REDIRECT_URI: redirectUri,
    }),
);

describe("GoogleOAuthService", () => {
    let request: jest.SpiedFunction<typeof fetch>;

    beforeEach(() => {
        request = jest.spyOn(globalThis, "fetch");
        request.mockRejectedValue(new Error("Unexpected HTTP request"));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("builds the authorization URL preserving state and redirect parameters", () => {
        const state = "opaque +&= state";

        const url = new URL(service.getAuthorizationUrl(state));

        expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            redirect_uri: redirectUri,
            client_id: "client-id",
            state,
            scope: "openid email profile",
            access_type: "offline",
            response_type: "code",
        });
        expect(request).not.toHaveBeenCalled();
    });

    it("exchanges the code using form encoding and returns the provider tokens", async () => {
        const tokens = {
            access_token: "access",
            refresh_token: "refresh",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "openid",
            id_token: "id",
        };
        request.mockResolvedValueOnce(Response.json(tokens));

        const result = await service.exchangeCode("code+&=");
        const body = request.mock.calls[0][1]?.body as URLSearchParams;

        expect(result).toEqual(tokens);
        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: expect.any(URLSearchParams),
        });
        expect(Object.fromEntries(body)).toEqual({
            client_id: "client-id",
            client_secret: "test-secret",
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
            code: "code+&=",
        });
    });

    it.each([400, 401, 503])("maps HTTP %s during code exchange to an authentication failure", async (status) => {
        request.mockResolvedValueOnce(new Response("private upstream error", { status }));

        await expect(service.exchangeCode("code")).rejects.toMatchObject({
            statusCode: 401,
            messageKey: "services.oauth.google.CODE_EXCHANGE_FAILED",
        });
    });

    it.each([
        { name: "Display Name", verified: true, expectedName: "Display Name" },
        { name: undefined, verified: false, expectedName: "user@example.test" },
        { name: null, verified: undefined, expectedName: "user@example.test" },
    ])("maps profile name and email verification: $expectedName / $verified", async ({ name, verified, expectedName }) => {
        request.mockResolvedValueOnce(
            Response.json({
                sub: "google-id",
                name,
                email: "user@example.test",
                email_verified: verified,
                picture: "https://example.test/photo",
            }),
        );

        const result = await service.fetchProfile("access-token");

        expect(result).toEqual({
            providerUserId: "google-id",
            displayName: expectedName,
            email: "user@example.test",
            emailVerified: Boolean(verified),
            pictureUrl: "https://example.test/photo",
        });
        expect(request).toHaveBeenCalledWith("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { Authorization: "Bearer access-token" },
        });
    });

    it("maps a profile HTTP failure to an external service error", async () => {
        request.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

        await expect(service.fetchProfile("token")).rejects.toMatchObject({
            statusCode: 502,
            messageKey: "services.oauth.google.SERVICE_UNAVAILABLE",
        });
    });

    it.each(["exchangeCode", "fetchProfile"] as const)("propagates transport failures from %s", async (method) => {
        const error = new Error("network unavailable");
        request.mockRejectedValueOnce(error);

        await expect(service[method]("value")).rejects.toBe(error);
    });

    it.each(["exchangeCode", "fetchProfile"] as const)("rejects invalid JSON from %s", async (method) => {
        request.mockResolvedValueOnce(new Response("not JSON"));

        await expect(service[method]("value")).rejects.toMatchObject({ name: "SyntaxError" });
    });
});
