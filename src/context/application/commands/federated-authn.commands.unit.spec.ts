import { describe, expect, it } from "@jest/globals";

import { FederatedAuthnCommandsUnitHelpers } from "~testing/unit/command-services/federated-authn.helpers";
import {
    AuthenticationContextClass,
    CodeChallengeMethod,
    AccountTopicAction,
    KafkaTopic,
    IdentifierType,
    AccountSubject,
    AccountStatus,
} from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new FederatedAuthnCommandsUnitHelpers();

describe("[Commands] - FederatedAuthn", () => {
    describe("[Method] - authorize", () => {
        it.each(["google", "github"])("[case] - starts %s authorization with provider-bound state", async (provider) => {
            // Arrange
            const {
                commands,
                cryptoService,
                oauthStateCacheService,
                googleOAuthService,
                githubOAuthService,
                authorizationCacheService,
            } = await helpers.commands();
            authorizationCacheService.get.mockResolvedValue({
                client: "client",
                redirectUri: "https://app.example/main",
                state: "pkce-state",
                codeChallenge: "challenge",
                codeChallengeMethod: CodeChallengeMethod.S256,
                scope: "openid",
            });
            cryptoService.generateToken.mockReturnValue("state-token");
            const oauth = provider === "google" ? googleOAuthService : githubOAuthService;
            oauth.getAuthorizationUrl.mockReturnValue("https://provider.example.test/authorize");

            // Act
            const result = await commands.authorize({ input: { provider, authorizationRequest: "request" } });

            // Assert
            expect(oauthStateCacheService.set.mock.calls).toEqual([
                [
                    {
                        state: "state-token",
                        metadata: {
                            provider,
                            redirectUri: "https://app.example/auth/federated/callback",
                            authorizationRequest: "request",
                            timeZone: "UTC",
                            locale: "en",
                        },
                    },
                ],
            ]);
            expect(oauth.getAuthorizationUrl.mock.calls).toEqual([["state-token"]]);
            expect(result.url).toBe("https://provider.example.test/authorize");
        });

        it("[case] - rejects an unsupported provider before allocating state", async () => {
            // Arrange
            const { commands, oauthStateCacheService } = await helpers.commands();

            // Act
            const result = commands.authorize({ input: { provider: "unsupported", authorizationRequest: "request" } });

            // Assert
            await expect(result).rejects.toThrow();
            expect(oauthStateCacheService.set).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - redirect", () => {
        it("[case] - returns to the saved UI callback without exchanging the provider code", async () => {
            // Arrange
            const { commands, oauthStateCacheService, githubOAuthService } = await helpers.commands();
            oauthStateCacheService.get.mockResolvedValue({
                provider: "github",
                authorizationRequest: "request",
                redirectUri: "https://app.example/auth/federated/callback",
            });

            // Act
            const result = await commands.redirect({
                input: { provider: "github", state: "state", code: "code", iss: "https://github.com/login/oauth" },
            });
            const url = new URL(result.url);
            const result1 = url.searchParams.get("code");

            // Assert
            expect(url.origin + url.pathname).toBe("https://app.example/auth/federated/callback");
            expect(result1).toBe("code");
            expect(githubOAuthService.exchangeCode).not.toHaveBeenCalled();
            expect(oauthStateCacheService.consume).not.toHaveBeenCalled();
        });

        it("[case] - rejects an unknown state instead of accepting a redirect URL from the browser", async () => {
            // Arrange
            const { commands, oauthStateCacheService } = await helpers.commands();
            oauthStateCacheService.get.mockResolvedValue(null);

            // Act
            const result = commands.redirect({ input: { provider: "github", state: "missing", code: "code" } });

            // Assert
            await expect(result).rejects.toThrow();
        });
    });

    describe("[Method] - callback", () => {
        it.each([
            ["github", "https://accounts.google.com"],
            ["google", "https://github.com/login/oauth"],
            ["github", "https://untrusted.example"],
            ["github", ""],
        ])("[case] - rejects an unexpected issuer for %s: %s", async (provider, iss) => {
            // Arrange
            const { commands, oauthStateCacheService, googleOAuthService, githubOAuthService, oauthCommands } =
                await helpers.commands();
            oauthStateCacheService.consume.mockResolvedValue({ provider, authorizationRequest: "request" });

            // Act
            const result = commands.callback({
                input: { provider, state: "state-token", code: "code", iss },
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toThrow();
            expect(googleOAuthService.exchangeCode).not.toHaveBeenCalled();
            expect(githubOAuthService.exchangeCode).not.toHaveBeenCalled();
            expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
        });

        it.each([
            { label: "absent", cached: null },
            { label: "wrong provider", cached: { provider: "github" } },
        ])("[case] - rejects absent or mismatched callback state before code exchange: $label", async ({ cached }) => {
            // Arrange
            const { commands, oauthStateCacheService, googleOAuthService } = await helpers.commands();
            oauthStateCacheService.consume.mockResolvedValue(cached);
            const exchange = new Error("code exchange must not happen");
            googleOAuthService.exchangeCode.mockRejectedValue(exchange);

            // Act
            const result = commands.callback({
                input: { provider: "google", state: "state-token", code: "code" },
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toThrow();
            expect(googleOAuthService.exchangeCode).not.toHaveBeenCalled();
        });

        it.each([
            ["google", undefined],
            ["google", "https://accounts.google.com"],
            ["github", "https://github.com/login/oauth"],
        ])("[case] - accepts matching state and issuer for %s (%s)", async (provider, iss) => {
            // Arrange
            const {
                commands,
                oauthStateCacheService,
                googleOAuthService,
                githubOAuthService,
                identifierRepository,
                oauthCommands,
            } = await helpers.commands();
            oauthStateCacheService.consume.mockResolvedValue({ provider, authorizationRequest: "request" });
            const oauth = provider === "google" ? googleOAuthService : githubOAuthService;
            const tokens = {
                access_token: "provider-token",
                token_type: "Bearer",
                expires_in: 3600,
                scope: "openid",
            };
            oauth.exchangeCode.mockResolvedValue(tokens);
            oauth.fetchProfile.mockResolvedValue({
                providerUserId: "provider-id",
                displayName: "User",
                emailVerified: false,
            });
            const account = helpers.createAccount();
            identifierRepository.findUnique.mockResolvedValue(helpers.createIdentifier({ account }));
            oauthCommands.completeAuthorization.mockResolvedValue({
                authorizationUrl: "https://app.example/main?code=code&state=pkce-state",
            });

            // Act
            const result = await commands.callback({
                input: { provider, state: "state-token", code: "code", iss },
                context: CONTEXT,
            });

            // Assert
            expect(oauthStateCacheService.consume.mock.calls).toEqual([[{ state: "state-token" }]]);
            expect(oauth.exchangeCode.mock.calls).toEqual([["code"]]);
            expect(identifierRepository.findUnique.mock.calls).toEqual([
                [{ options: { populate: ["account"] }, where: { provider, providerUserId: "provider-id" } }],
            ]);
            expect(result).toEqual(
                expect.objectContaining({ authorizationUrl: "https://app.example/main?code=code&state=pkce-state" }),
            );
            expect(oauthCommands.completeAuthorization).toHaveBeenCalledWith({
                authorizationRequest: "request",
                account: account.id,
                acr: AuthenticationContextClass.FEDERATED,
            });
            expect(result).not.toHaveProperty("accessToken");
        });
    });

    describe("[Method] - attachToExisting", () => {
        it("[case] - links a provider identifier without issuing session tokens", async () => {
            // Arrange
            const { commands, identifierService, oauthCommands, transaction } = await helpers.commands();
            const account = helpers.createAccount();
            oauthCommands.completeAuthorization.mockResolvedValue({
                authorizationUrl: "https://app.example/main?code=code&state=pkce-state",
            });

            // Act
            await commands.attachToExisting({
                input: {
                    account,
                    provider: "github",
                    providerUserId: "provider-id",
                    emailVerified: true,
                    profile: { displayName: "User" },
                },
                context: CONTEXT,
            });

            // Assert
            expect(identifierService.create.mock.calls).toEqual([
                [
                    {
                        input: {
                            account,
                            identifier: {
                                identity: "github:provider-id",
                                providerUserId: "provider-id",
                                provider: "github",
                                type: IdentifierType.OAUTH,
                                isVerified: true,
                            },
                        },
                        transaction: transaction.entityManager,
                    },
                ],
            ]);
            expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
        });

        it("[case] - propagates a linking failure without issuing a session", async () => {
            // Arrange
            const { commands, identifierService, oauthCommands } = await helpers.commands();
            const failure = new Error("identifier already linked");
            identifierService.create.mockRejectedValue(failure);

            // Act
            const result = commands.attachToExisting({
                input: {
                    account: helpers.createAccount(),
                    provider: "google",
                    providerUserId: "provider-id",
                    emailVerified: false,
                    profile: { displayName: "User" },
                },
                context: CONTEXT,
            });

            // Assert
            await expect(result).rejects.toBe(failure);
            expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - provision", () => {
        it.each([false, true])(
            "[case] - adds an email identifier during provisioning only for a verified provider email: %s",
            async (emailVerified) => {
                // Arrange
                const {
                    commands,
                    accountService,
                    recoveryCodeService,
                    oauthCommands,
                    cryptoService,
                    hashingService,
                    transaction,
                    run,
                } = await helpers.commands();
                const account = helpers.createAccount();
                accountService.create.mockReturnValue(account);
                cryptoService.generateRecoveryCodes.mockReturnValue(["code-one", "code-two"]);
                hashingService.hash.mockImplementation(({ value }) => Promise.resolve(`hash:${value}`));

                // Act
                const result = await commands.provision({
                    input: {
                        provider: "google",
                        providerUserId: "provider-id",
                        email: "mail@example.test",
                        emailVerified,
                        profile: { displayName: "User" },
                    },
                    context: CONTEXT,
                });

                // Assert
                expect(run).toHaveBeenCalledWith(
                    expect.objectContaining({
                        outbox: {
                            payloadMapper: expect.any(Function),
                            actionType: AccountTopicAction.VERIFY,
                            destinationTopic: KafkaTopic.ACCOUNT,
                        },
                    }),
                );
                expect(accountService.create.mock.calls).toEqual([
                    [
                        {
                            input: {
                                primaryIdentifier: {
                                    identity: "google:provider-id",
                                    providerUserId: "provider-id",
                                    provider: "google",
                                    type: IdentifierType.OAUTH,
                                    isVerified: true,
                                },
                                additionalIdentifier: emailVerified
                                    ? { identity: "mail@example.test", type: IdentifierType.EMAIL, isVerified: true }
                                    : undefined,
                                profile: { displayName: "User" },
                                subject: AccountSubject.HUMAN,
                                status: AccountStatus.ACTIVE,
                            },
                            transaction: transaction.entityManager,
                        },
                    ],
                ]);
                expect(recoveryCodeService.generate.mock.calls).toEqual([
                    [
                        {
                            input: { account, hashes: ["hash:code-one", "hash:code-two"] },
                            transaction: transaction.entityManager,
                        },
                    ],
                ]);
                expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
                expect(result.account).toBe(account.id);
                expect(result.recoveryCodes).toEqual(["code-one", "code-two"]);
            },
        );
    });
});
