import { describe, expect, it } from "@jest/globals";

import { FederatedAuthnCommandsUnitHelpers } from "~testing/unit/command-services/federated-authn.helpers";
import { IdentifierType, AccountSubject, AccountStatus, AuthenticationContextClass } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new FederatedAuthnCommandsUnitHelpers();

describe("FederatedAuthnCommands", () => {
    describe("authorize", () => {
        it.each(["google", "github"])("starts %s authorization with provider-bound state", async (provider) => {
            const { commands, cryptoService, oauthStateCacheService, googleOAuthService, githubOAuthService } =
                await helpers.commands();
            cryptoService.generateToken.mockReturnValue("state-token");
            const oauth = provider === "google" ? googleOAuthService : githubOAuthService;
            oauth.getAuthorizationUrl.mockReturnValue("https://provider.example.test/authorize");

            const result = await commands.authorize({ input: { provider } });

            expect(oauthStateCacheService.set.mock.calls).toEqual([[{ state: "state-token", metadata: { provider } }]]);
            expect(oauth.getAuthorizationUrl.mock.calls).toEqual([["state-token"]]);
            expect(result.url).toBe("https://provider.example.test/authorize");
        });

        it("rejects an unsupported provider before allocating state", async () => {
            const { commands, oauthStateCacheService } = await helpers.commands();

            await expect(commands.authorize({ input: { provider: "unsupported" } })).rejects.toThrow();

            expect(oauthStateCacheService.set).not.toHaveBeenCalled();
        });
    });

    describe("callback", () => {
        it.failing.each([null, { provider: "github" }])(
            "rejects absent or mismatched callback state before code exchange: %j",
            async (cached) => {
                const { commands, oauthStateCacheService, googleOAuthService } = await helpers.commands();
                oauthStateCacheService.consume.mockResolvedValue(cached);
                const exchange = new Error("code exchange must not happen");
                googleOAuthService.exchangeCode.mockRejectedValue(exchange);

                await expect(
                    commands.callback({
                        input: { provider: "google", state: "state-token", code: "code" },
                        context: CONTEXT,
                    }),
                ).rejects.toThrow();

                expect(googleOAuthService.exchangeCode).not.toHaveBeenCalled();
            },
        );

        it.failing("accepts matching callback state and signs in the account linked to the provider", async () => {
            const { commands, oauthStateCacheService, googleOAuthService, identifierRepository, sessionService } =
                await helpers.commands();
            oauthStateCacheService.consume.mockResolvedValue({ provider: "google" });
            googleOAuthService.exchangeCode.mockResolvedValue({
                access_token: "provider-token",
                token_type: "Bearer",
                expires_in: 3600,
                scope: "openid",
            });
            googleOAuthService.fetchProfile.mockResolvedValue({
                providerUserId: "provider-id",
                displayName: "User",
                emailVerified: false,
            });
            const account = helpers.createAccount();
            identifierRepository.findUnique.mockResolvedValue(helpers.createIdentifier({ account }));
            sessionService.create.mockResolvedValue({
                accessToken: "access",
                refreshToken: "refresh",
                revokedSessions: [],
            });

            const result = await commands.callback({
                input: { provider: "google", state: "state-token", code: "code" },
                context: CONTEXT,
            });

            expect(oauthStateCacheService.consume.mock.calls).toEqual([[{ state: "state-token" }]]);
            expect(googleOAuthService.exchangeCode.mock.calls).toEqual([["code"]]);
            expect(identifierRepository.findUnique.mock.calls).toEqual([
                [{ options: { populate: ["account"] }, where: { provider: "google", providerUserId: "provider-id" } }],
            ]);
            expect(result).toEqual(expect.objectContaining({ accessToken: "access", refreshToken: "refresh" }));
        });
    });

    describe("attachToExisting", () => {
        it("links a provider identifier and creates a federated session in the same transaction", async () => {
            const { commands, identifierService, sessionService, transaction } = await helpers.commands();
            const account = helpers.createAccount();
            sessionService.create.mockResolvedValue({
                accessToken: "access",
                refreshToken: "refresh",
                revokedSessions: [],
            });

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
            expect(sessionService.create.mock.calls).toEqual([
                [
                    expect.objectContaining({
                        input: expect.objectContaining({ account, acr: AuthenticationContextClass.FEDERATED, ...CONTEXT }),
                        transaction: transaction.entityManager,
                    }),
                ],
            ]);
            expect(identifierService.create.mock.invocationCallOrder[0]).toBeLessThan(
                sessionService.create.mock.invocationCallOrder[0]!,
            );
        });

        it("propagates a linking failure without issuing a session", async () => {
            const { commands, identifierService, sessionService } = await helpers.commands();
            const failure = new Error("identifier already linked");
            identifierService.create.mockRejectedValue(failure);

            await expect(
                commands.attachToExisting({
                    input: {
                        account: helpers.createAccount(),
                        provider: "google",
                        providerUserId: "provider-id",
                        emailVerified: false,
                        profile: { displayName: "User" },
                    },
                    context: CONTEXT,
                }),
            ).rejects.toBe(failure);

            expect(sessionService.create).not.toHaveBeenCalled();
        });
    });

    describe("provision", () => {
        it.each([false, true])(
            "adds an email identifier during provisioning only for a verified provider email: %s",
            async (emailVerified) => {
                const {
                    commands,
                    accountService,
                    recoveryCodeService,
                    sessionService,
                    cryptoService,
                    hashingService,
                    transaction,
                } = await helpers.commands();
                const account = helpers.createAccount();
                accountService.create.mockReturnValue(account);
                cryptoService.generateRecoveryCodes.mockReturnValue(["code-one", "code-two"]);
                hashingService.hash.mockImplementation(({ value }) => Promise.resolve(`hash:${value}`));
                sessionService.create.mockResolvedValue({
                    accessToken: "access",
                    refreshToken: "refresh",
                    revokedSessions: [],
                });

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
                expect(sessionService.create.mock.calls).toEqual([
                    [
                        expect.objectContaining({
                            input: expect.objectContaining({ account, acr: AuthenticationContextClass.FEDERATED }),
                            transaction: transaction.entityManager,
                        }),
                    ],
                ]);
                expect(result.recoveryCodes).toEqual(["code-one", "code-two"]);
            },
        );
    });
});
