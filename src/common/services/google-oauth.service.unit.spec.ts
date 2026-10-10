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

describe("[CommonService] - GoogleOAuth", () => {
    let request: jest.SpiedFunction<typeof fetch>;

    beforeEach(() => {
        request = jest.spyOn(globalThis, "fetch");
        request.mockRejectedValue(new Error("Unexpected HTTP request"));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - getAuthorizationUrl", () => {
        it("[case] - builds the authorization URL preserving state and redirect parameters", () => {
            // Arrange
            const state = "opaque +&= state";

            // Act
            const url = new URL(service.getAuthorizationUrl(state));
            const result = Object.fromEntries(url.searchParams);

            // Assert
            expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
            expect(result).toEqual({
                redirect_uri: redirectUri,
                client_id: "client-id",
                state,
                scope: "openid email profile",
                access_type: "offline",
                response_type: "code",
            });
            expect(request).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - exchangeCode", () => {
        it("[case] - exchanges the code using form encoding and returns the provider tokens", async () => {
            // Arrange
            const tokens = {
                access_token: "access",
                refresh_token: "refresh",
                token_type: "Bearer",
                expires_in: 3600,
                scope: "openid",
                id_token: "id",
            };
            request.mockResolvedValueOnce(Response.json(tokens));

            // Act
            const result = await service.exchangeCode("code+&=");
            const body = request.mock.calls[0][1]?.body as URLSearchParams;
            const result1 = Object.fromEntries(body);

            // Assert
            expect(result).toEqual(tokens);
            expect(request).toHaveBeenCalledTimes(1);
            expect(request).toHaveBeenCalledWith("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: expect.any(URLSearchParams),
            });
            expect(result1).toEqual({
                client_id: "client-id",
                client_secret: "test-secret",
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                code: "code+&=",
            });
        });

        it.each([400, 401, 503])(
            "[case] - maps HTTP %s during code exchange to an authentication failure",
            async (status) => {
                // Arrange
                request.mockResolvedValueOnce(new Response("private upstream error", { status }));

                // Act
                const result = service.exchangeCode("code");

                // Assert
                await expect(result).rejects.toMatchObject({
                    statusCode: 401,
                    messageKey: "services.oauth.google.CODE_EXCHANGE_FAILED",
                });
            },
        );
    });

    describe("[Method] - fetchProfile", () => {
        it.each([
            { name: "Display Name", verified: true, expectedName: "Display Name" },
            { name: undefined, verified: false, expectedName: "user@example.test" },
            { name: null, verified: undefined, expectedName: "user@example.test" },
        ])(
            "[case] - maps profile name and email verification: $expectedName / $verified",
            async ({ name, verified, expectedName }) => {
                // Arrange
                request.mockResolvedValueOnce(
                    Response.json({
                        sub: "google-id",
                        name,
                        email: "user@example.test",
                        email_verified: verified,
                        picture: "https://example.test/photo",
                    }),
                );

                // Act
                const result = await service.fetchProfile("access-token");

                // Assert
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
            },
        );

        it("[case] - maps a profile HTTP failure to an external service error", async () => {
            // Arrange
            request.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

            // Act
            const result = service.fetchProfile("token");

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.oauth.google.SERVICE_UNAVAILABLE",
            });
        });
    });

    describe("[Behavior] - provider failures", () => {
        it.each(["exchangeCode", "fetchProfile"] as const)(
            "[case] - propagates transport failures from %s",
            async (method) => {
                // Arrange
                const error = new Error("network unavailable");
                request.mockRejectedValueOnce(error);

                // Act
                const result = service[method]("value");

                // Assert
                await expect(result).rejects.toBe(error);
            },
        );

        it.each(["exchangeCode", "fetchProfile"] as const)("[case] - rejects invalid JSON from %s", async (method) => {
            // Arrange
            request.mockResolvedValueOnce(new Response("not JSON"));

            // Act
            const result = service[method]("value");

            // Assert
            await expect(result).rejects.toMatchObject({ name: "SyntaxError" });
        });
    });
});
