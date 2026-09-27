import { describe, expect, it } from "@jest/globals";

import { CodeChallengeMethod, OAuthResponseType, TokenGrantType, OAuthTokenTypeHint } from "~context/enums";
import { OAuthCommandsUnitHelpers } from "~testing/unit/command-services/oauth.helpers";
import { SYSTEM_REALM_ID } from "~context/constants";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new OAuthCommandsUnitHelpers();
const ACCOUNT = "target-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("OAuthCommands", () => {
    describe("authorize", () => {
        it.each(["revoked", "realm-revoked", "redirect"])(
            "rejects authorization with an invalid $state client constraint: %s",
            async (state) => {
                const { commands, interfaceClientRepository, authorizationCacheService } = helpers.commands();
                interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(
                    helpers.createInterfaceClient({
                        isRevoked: state === "revoked",
                        isRealmRevoked: state === "realm-revoked",
                        redirectUris: state === "redirect" ? [] : ["https://app.example.test/cb"],
                    }),
                );

                await expect(
                    commands.authorize({
                        input: {
                            client: ID,
                            redirectUri: "https://app.example.test/cb",
                            codeChallenge: "challenge",
                            codeChallengeMethod: CodeChallengeMethod.S256,
                            responseType: OAuthResponseType.CODE,
                            state: "state",
                        },
                    }),
                ).rejects.toThrow();

                expect(authorizationCacheService.create).not.toHaveBeenCalled();
            },
        );

        it("preserves authorization parameters and adds the request ID to the client's login URL", async () => {
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

            const result = await commands.authorize({ input });

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

    describe("authorizationCode", () => {
        it.each(["missing", "client", "redirect", "pkce"])(
            "rejects an authorization code with a %s mismatch",
            async (state) => {
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

                await expect(
                    commands.authorizationCode({
                        input: {
                            grantType: TokenGrantType.AUTHORIZATION_CODE,
                            client: ID,
                            redirectUri: "https://app.example.test/cb",
                            code: "code",
                            codeVerifier: "verifier",
                        },
                        context: CONTEXT,
                    }),
                ).rejects.toThrow();

                expect(sessionCommands.create).not.toHaveBeenCalled();
            },
        );
    });

    describe("token", () => {
        it.each([SYSTEM_REALM_ID, REALM])(
            "exchanges a bound code and deduplicates the session realms: %s",
            async (realm) => {
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
            "rejects refresh for a %s client before rotating tokens",
            async (state) => {
                const { commands, interfaceClientRepository, sessionCommands } = helpers.commands();
                interfaceClientRepository.findUnique.mockResolvedValue(
                    state === "missing"
                        ? null
                        : helpers.createInterfaceClient({
                              isRevoked: state === "revoked",
                              isRealmRevoked: state === "realm-revoked",
                          }),
                );

                await expect(
                    commands.token({
                        input: {
                            grantType: TokenGrantType.REFRESH_TOKEN,
                            client: ID,
                            refreshToken: "refresh",
                            redirectUri: "",
                            code: "",
                            codeVerifier: "",
                        },
                        context: CONTEXT,
                    }),
                ).rejects.toThrow();

                expect(sessionCommands.refresh).not.toHaveBeenCalled();
            },
        );

        it("refreshes the requested client's token and adds configured token lifetime", async () => {
            const { commands, interfaceClientRepository, sessionCommands } = helpers.commands();
            interfaceClientRepository.findUnique.mockResolvedValue(helpers.createInterfaceClient());
            sessionCommands.refresh.mockResolvedValue({
                message: "commands.session.REFRESHED" as const,
                accessToken: "access",
                refreshToken: "new-refresh",
            });

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

    describe("revoke", () => {
        it.each(["invalid", "foreign", "owned"])(
            "revocation accepts a %s token without revealing token validity",
            async (state) => {
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

                await commands.revoke({ client: ID, token: "refresh", context: CONTEXT });

                if (state === "owned") {
                    expect(sessionCommands.revoke.mock.calls).toEqual([
                        [{ actor: ACCOUNT, session: "session-id", input: { token: "refresh" }, context: CONTEXT }],
                    ]);
                } else {
                    expect(sessionCommands.revoke).not.toHaveBeenCalled();
                }
            },
        );

        it("rejects an unsupported revocation hint before verifying a token", async () => {
            const { commands, interfaceClientRepository, jwtService } = helpers.commands();
            interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(helpers.createInterfaceClient());

            await expect(
                commands.revoke({
                    client: ID,
                    token: "access",
                    tokenTypeHint: OAuthTokenTypeHint.ACCESS_TOKEN,
                    context: CONTEXT,
                }),
            ).rejects.toThrow();

            expect(jwtService.verifyRefresh).not.toHaveBeenCalled();
        });
    });

    describe("assertAuthorizationPending / completeAuthorization", () => {
        it("rejects a missing authorization request without issuing a code", async () => {
            const { commands, authorizationCacheService } = helpers.commands();
            authorizationCacheService.get.mockResolvedValue(null);
            authorizationCacheService.issue.mockResolvedValue(null);

            await expect(commands.assertAuthorizationPending({ authorizationRequest: ID })).rejects.toThrow();
            await expect(
                commands.completeAuthorization({ authorizationRequest: ID, account: ACCOUNT, acr: "1" }),
            ).rejects.toThrow();

            expect(authorizationCacheService.issue.mock.calls).toEqual([
                [{ authorizationRequest: ID, account: ACCOUNT, acr: "1" }],
            ]);
        });
    });

    describe("completeAuthorization", () => {
        it("builds the callback from the stored redirect URI and encodes state and code", async () => {
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

            const result = await commands.completeAuthorization({ authorizationRequest: ID, account: ACCOUNT, acr: "1" });

            const url = new URL(result.authorizationUrl);
            expect(url.origin).toBe("https://app.example.test");
            expect(url.searchParams.get("locale")).toBe("ru");
            expect(url.searchParams.get("code")).toBe("code&value");
            expect(url.searchParams.get("state")).toBe("state&value");
            expect(url.searchParams.get("iss")).toBe("https://identity.example.test");
        });
    });

    describe("endSession", () => {
        it.each([undefined, "https://untrusted.example.test/cb", "https://app.example.test/cb"])(
            "redirects logout only to a registered URI: %s",
            async (postLogoutRedirectUri) => {
                const { commands, interfaceClientRepository, jwtService, sessionCommands } = helpers.commands();
                const { response, redirect } = helpers.response();
                jwtService.verifyIdToken.mockResolvedValue({ sid: "session-id", sub: ACCOUNT, aud: ID });
                interfaceClientRepository.findUnique.mockResolvedValue(
                    helpers.createInterfaceClient({ redirectUris: ["https://app.example.test/cb"] }),
                );

                await commands.endSession({
                    input: { idTokenHint: "id-token", postLogoutRedirectUri, state: "state&value" },
                    context: CONTEXT,
                    response,
                });

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
