import { describe, expect, it } from "@jest/globals";

import { CodeChallengeMethod, OAuthResponseType, TokenGrantType, OAuthTokenTypeHint } from "~context/enums";
import { OAuthCommandsUnitHelpers } from "~testing/unit/command-services/oauth.helpers";
import { SYSTEM_REALM_ID } from "~context/constants";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new OAuthCommandsUnitHelpers();
const ACCOUNT = "target-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("[Commands] - OAuth", () => {
    describe("[Method] - authorize", () => {
        it.each(["revoked", "realm-revoked", "redirect"])(
            "[case] - rejects authorization with an invalid client constraint: %s",
            async (state) => {
                // Arrange
                const { commands, interfaceClientRepository, authorizationCacheService } = helpers.commands();
                interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(
                    helpers.createInterfaceClient({
                        isRevoked: state === "revoked",
                        isRealmRevoked: state === "realm-revoked",
                        redirectUris: state === "redirect" ? [] : ["https://app.example.test/cb"],
                    }),
                );

                // Act
                const result = commands.authorize({
                    input: {
                        client: ID,
                        redirectUri: "https://app.example.test/cb",
                        codeChallenge: "challenge",
                        codeChallengeMethod: CodeChallengeMethod.S256,
                        responseType: OAuthResponseType.CODE,
                        state: "state",
                    },
                });

                // Assert
                await expect(result).rejects.toThrow();
                expect(authorizationCacheService.create).not.toHaveBeenCalled();
            },
        );

        it("[case] - preserves authorization parameters and adds the request ID to the client's login URL", async () => {
            // Arrange
            const { commands, interfaceClientRepository, authorizationCacheService } = helpers.commands();
            interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(
                helpers.createInterfaceClient({
                    id: ID,
                    authAddress: "https://login.example.test/?locale=ru",
                    redirectUris: ["https://app.example.test/cb"],
                }),
            );
            authorizationCacheService.create.mockResolvedValue({ id: "request-id" });
            const input = {
                client: ID,
                redirectUri: "https://app.example.test/cb",
                codeChallenge: "challenge",
                codeChallengeMethod: CodeChallengeMethod.S256,
                responseType: OAuthResponseType.CODE,
                state: "state",
                scope: "openid email",
                nonce: "nonce",
            };

            // Act
            const result = await commands.authorize({ input });

            // Assert
            expect(authorizationCacheService.create.mock.calls).toEqual([
                [
                    {
                        client: ID,
                        redirectUri: input.redirectUri,
                        codeChallenge: "challenge",
                        codeChallengeMethod: CodeChallengeMethod.S256,
                        state: "state",
                        scope: "openid email",
                        nonce: "nonce",
                    },
                ],
            ]);
            expect(result.url).toBe("https://login.example.test/?locale=ru&authorizationRequest=request-id");
        });
    });

    describe("[Method] - authorizationCode", () => {
        it.each(["missing", "client", "redirect", "pkce"])(
            "[case] - rejects an authorization code with a %s mismatch",
            async (state) => {
                // Arrange
                const { commands, interfaceClientRepository, authorizationCacheService, cryptoService, sessionCommands } =
                    helpers.commands();
                interfaceClientRepository.findUnique.mockResolvedValue(
                    helpers.createInterfaceClient({ id: ID, redirectUris: ["https://app.example.test/cb"] }),
                );
                authorizationCacheService.consume.mockResolvedValue(
                    state === "missing"
                        ? null
                        : {
                              account: ACCOUNT,
                              acr: "1",
                              client: state === "client" ? "another-client" : ID,
                              redirectUri:
                                  state === "redirect" ? "https://other.example.test/cb" : "https://app.example.test/cb",
                              scope: "openid",
                              codeChallenge: "challenge",
                              codeChallengeMethod: CodeChallengeMethod.S256,
                          },
                );
                cryptoService.verifyCodeChallenge.mockReturnValue(state !== "pkce");

                // Act
                const result = commands.authorizationCode({
                    input: {
                        grantType: TokenGrantType.AUTHORIZATION_CODE,
                        client: ID,
                        redirectUri: "https://app.example.test/cb",
                        code: "code",
                        codeVerifier: "verifier",
                    },
                    context: CONTEXT,
                });

                // Assert
                await expect(result).rejects.toThrow();
                expect(sessionCommands.create).not.toHaveBeenCalled();
            },
        );
    });

    describe("[Method] - token", () => {
        it.each([SYSTEM_REALM_ID, REALM])(
            "[case] - exchanges a bound code and deduplicates the session realms: %s",
            async (realm) => {
                // Arrange
                const { commands, interfaceClientRepository, authorizationCacheService, cryptoService, sessionCommands } =
                    helpers.commands();
                interfaceClientRepository.findUnique.mockResolvedValue(
                    helpers.createInterfaceClient({ id: ID, realm, redirectUris: ["https://app.example.test/cb"] }),
                );
                authorizationCacheService.consume.mockResolvedValue({
                    account: ACCOUNT,
                    acr: "2",
                    client: ID,
                    redirectUri: "https://app.example.test/cb",
                    scope: "openid email",
                    nonce: "nonce",
                    codeChallenge: "challenge",
                    codeChallengeMethod: CodeChallengeMethod.S256,
                });
                cryptoService.verifyCodeChallenge.mockReturnValue(true);
                sessionCommands.create.mockResolvedValue({
                    accessToken: "access",
                    refreshToken: "refresh",
                    idToken: "id-token",
                });

                // Act
                const result = await commands.token({
                    input: {
                        grantType: TokenGrantType.AUTHORIZATION_CODE,
                        client: ID,
                        redirectUri: "https://app.example.test/cb",
                        code: "code",
                        codeVerifier: "verifier",
                    },
                    context: CONTEXT,
                });

                // Assert
                expect(authorizationCacheService.consume.mock.calls).toEqual([[{ code: "code" }]]);
                expect(cryptoService.verifyCodeChallenge.mock.calls).toEqual([
                    [{ challenge: "challenge", verifier: "verifier" }],
                ]);
                expect(sessionCommands.create.mock.calls).toEqual([
                    [
                        {
                            input: {
                                account: ACCOUNT,
                                client: ID,
                                scope: "openid email",
                                nonce: "nonce",
                                acr: "2",
                                realms: realm === SYSTEM_REALM_ID ? [SYSTEM_REALM_ID] : [SYSTEM_REALM_ID, REALM],
                            },
                            context: CONTEXT,
                        },
                    ],
                ]);
                expect(result).toEqual({
                    accessToken: "access",
                    refreshToken: "refresh",
                    idToken: "id-token",
                    tokenType: "Bearer",
                    expiresIn: 900,
                });
            },
        );

        it.each(["missing", "revoked", "realm-revoked"])(
            "[case] - rejects refresh for a %s client before rotating tokens",
            async (state) => {
                // Arrange
                const { commands, interfaceClientRepository, sessionCommands } = helpers.commands();
                interfaceClientRepository.findUnique.mockResolvedValue(
                    state === "missing"
                        ? null
                        : helpers.createInterfaceClient({
                              isRevoked: state === "revoked",
                              isRealmRevoked: state === "realm-revoked",
                          }),
                );

                // Act
                const result = commands.token({
                    input: {
                        grantType: TokenGrantType.REFRESH_TOKEN,
                        client: ID,
                        refreshToken: "refresh",
                        redirectUri: "",
                        code: "",
                        codeVerifier: "",
                    },
                    context: CONTEXT,
                });

                // Assert
                await expect(result).rejects.toThrow();
                expect(sessionCommands.refresh).not.toHaveBeenCalled();
            },
        );

        it("[case] - refreshes the requested client's token and adds configured token lifetime", async () => {
            // Arrange
            const { commands, interfaceClientRepository, sessionCommands } = helpers.commands();
            interfaceClientRepository.findUnique.mockResolvedValue(helpers.createInterfaceClient());
            sessionCommands.refresh.mockResolvedValue({
                message: "commands.session.REFRESHED" as const,
                accessToken: "access",
                refreshToken: "new-refresh",
            });

            // Act
            const result = await commands.token({
                input: {
                    grantType: TokenGrantType.REFRESH_TOKEN,
                    client: ID,
                    refreshToken: "refresh",
                    redirectUri: "",
                    code: "",
                    codeVerifier: "",
                },
                context: CONTEXT,
            });

            // Assert
            expect(sessionCommands.refresh.mock.calls).toEqual([
                [{ input: { client: ID, refreshToken: "refresh" }, context: CONTEXT }],
            ]);
            expect(result).toEqual({
                message: "commands.session.REFRESHED" as const,
                accessToken: "access",
                refreshToken: "new-refresh",
                tokenType: "Bearer",
                expiresIn: 900,
            });
        });
    });

    describe("[Method] - revoke", () => {
        it.each(["invalid", "foreign", "owned"])(
            "[case] - revocation accepts a %s token without revealing token validity",
            async (state) => {
                // Arrange
                const { commands, interfaceClientRepository, jwtService, sessionCommands } = helpers.commands();
                interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(helpers.createInterfaceClient());
                if (state === "invalid") {
                    jwtService.verifyRefresh.mockRejectedValue(new Error("invalid token"));
                } else {
                    jwtService.verifyRefresh.mockResolvedValue({
                        client_id: state === "owned" ? ID : "foreign-client",
                        sid: "session-id",
                        sub: ACCOUNT,
                    });
                }

                // Act
                await commands.revoke({ client: ID, token: "refresh", context: CONTEXT });

                // Assert
                if (state === "owned") {
                    expect(sessionCommands.revoke.mock.calls).toEqual([
                        [{ actor: ACCOUNT, session: "session-id", input: { token: "refresh" }, context: CONTEXT }],
                    ]);
                } else {
                    expect(sessionCommands.revoke).not.toHaveBeenCalled();
                }
            },
        );

        it("[case] - rejects an unsupported revocation hint before verifying a token", async () => {
            // Arrange
            const { commands, interfaceClientRepository, jwtService } = helpers.commands();
            interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(helpers.createInterfaceClient());

            // Act
            const result = commands.revoke({
                client: ID,
                token: "access",
                tokenTypeHint: OAuthTokenTypeHint.ACCESS_TOKEN,
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toThrow();
            expect(jwtService.verifyRefresh).not.toHaveBeenCalled();
        });
    });

    describe("[Behavior] - authorization completion", () => {
        it("[case] - rejects a missing authorization request without issuing a code", async () => {
            // Arrange
            const { commands, authorizationCacheService } = helpers.commands();
            authorizationCacheService.get.mockResolvedValue(null);
            authorizationCacheService.issue.mockResolvedValue(null);

            // Act
            const result = commands.assertAuthorizationPending({ authorizationRequest: ID });
            await Promise.allSettled([result]);
            const result1 = commands.completeAuthorization({ authorizationRequest: ID, account: ACCOUNT, acr: "1" });

            // Assert
            await expect(result).rejects.toThrow();
            await expect(result1).rejects.toThrow();
            expect(authorizationCacheService.issue.mock.calls).toEqual([
                [{ authorizationRequest: ID, account: ACCOUNT, acr: "1" }],
            ]);
        });
    });

    describe("[Method] - completeAuthorization", () => {
        it("[case] - builds the callback from the stored redirect URI and encodes state and code", async () => {
            // Arrange
            const { commands, authorizationCacheService } = helpers.commands();
            authorizationCacheService.issue.mockResolvedValue({
                code: "code&value",
                request: {
                    client: ID,
                    redirectUri: "https://app.example.test/cb?locale=ru",
                    codeChallenge: "challenge",
                    codeChallengeMethod: CodeChallengeMethod.S256,
                    scope: "openid",
                    state: "state&value",
                },
            });

            // Act
            const result = await commands.completeAuthorization({ authorizationRequest: ID, account: ACCOUNT, acr: "1" });
            const url = new URL(result.authorizationUrl);
            const result1 = url.searchParams.get("locale");
            const result2 = url.searchParams.get("code");
            const result3 = url.searchParams.get("state");
            const result4 = url.searchParams.get("iss");

            // Assert
            expect(url.origin).toBe("https://app.example.test");
            expect(result1).toBe("ru");
            expect(result2).toBe("code&value");
            expect(result3).toBe("state&value");
            expect(result4).toBe("https://identity.example.test");
        });
    });

    describe("[Method] - endSession", () => {
        it.each([undefined, "https://untrusted.example.test/cb", "https://app.example.test/cb"])(
            "[case] - redirects logout only to a registered URI: %s",
            async (postLogoutRedirectUri) => {
                // Arrange
                const { commands, interfaceClientRepository, jwtService, sessionCommands } = helpers.commands();
                const { response, redirect } = helpers.response();
                jwtService.verifyIdToken.mockResolvedValue({ sid: "session-id", sub: ACCOUNT, aud: ID });
                interfaceClientRepository.findUnique.mockResolvedValue(
                    helpers.createInterfaceClient({ redirectUris: ["https://app.example.test/cb"] }),
                );

                // Act
                await commands.endSession({
                    input: { idTokenHint: "id-token", postLogoutRedirectUri, state: "state&value" },
                    context: CONTEXT,
                    response,
                });

                // Assert
                expect(sessionCommands.revoke.mock.calls).toEqual([
                    [{ actor: ACCOUNT, session: "session-id", input: {}, context: CONTEXT }],
                ]);
                if (postLogoutRedirectUri === "https://app.example.test/cb") {
                    expect(redirect.mock.calls).toEqual([["https://app.example.test/cb?state=state%26value", 302]]);
                } else {
                    expect(redirect).not.toHaveBeenCalled();
                }
            },
        );
    });
});
