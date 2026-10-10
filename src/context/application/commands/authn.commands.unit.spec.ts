import { describe, expect, it } from "@jest/globals";

import { AuthnCommandsUnitHelpers } from "~testing/unit/command-services/authn.helpers";
import { AccountStatus, AuthenticationContextClass } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new AuthnCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ID = "entity-a";

describe("[Commands] - Authn", () => {
    describe("[Method] - password", () => {
        it.each(["missing", "no-password", "invalid", "pending", "suspended"])(
            "[case] - blocks password login for %s credentials or account",
            async (state) => {
                // Arrange
                const { commands, identifierRepository, hashingService, oauthCommands, pending2FACacheService } =
                    await helpers.commands();
                const account = helpers.createAccount({
                    status:
                        state === "pending"
                            ? AccountStatus.PENDING
                            : state === "suspended"
                              ? AccountStatus.SUSPENDED
                              : AccountStatus.ACTIVE,
                    password: state === "no-password" ? undefined : helpers.createPassword(),
                });
                identifierRepository.findUnique.mockResolvedValue(
                    state === "missing" ? null : helpers.createIdentifier({ account }),
                );
                hashingService.verify.mockResolvedValue(state !== "invalid");

                // Act
                const result = commands.password({
                    input: { authorizationRequest: ID, identifier: "mail@example.test", password: "password" },
                });

                // Assert
                await expect(result).rejects.toThrow();
                expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
                expect(pending2FACacheService.set).not.toHaveBeenCalled();
            },
        );

        it.each([false, true])(
            "[case] - requires a confirmed second factor before completing password authorization: %s",
            async (confirmed) => {
                // Arrange
                const {
                    commands,
                    identifierRepository,
                    hashingService,
                    oauthCommands,
                    cryptoService,
                    pending2FACacheService,
                } = await helpers.commands();
                const account = helpers.createAccount({ id: ACCOUNT, password: helpers.createPassword() });
                account.secondFactors = helpers.collection({
                    owner: account,
                    items: [helpers.createSecondFactor({ confirmedAt: confirmed ? new Date() : undefined })],
                });
                identifierRepository.findUnique.mockResolvedValue(helpers.createIdentifier({ account }));
                hashingService.verify.mockResolvedValue(true);
                cryptoService.generateToken.mockReturnValue("pending-token");
                oauthCommands.completeAuthorization.mockResolvedValue({ authorizationUrl: "https://app.example.test/cb" });

                // Act
                const result = await commands.password({
                    input: { authorizationRequest: ID, identifier: "mail@example.test", password: "password" },
                });

                // Assert
                expect(oauthCommands.assertAuthorizationPending.mock.calls).toEqual([[{ authorizationRequest: ID }]]);
                if (confirmed) {
                    expect(result).toEqual(expect.objectContaining({ pendingToken: "pending-token", requires2FA: true }));
                    expect(pending2FACacheService.set.mock.calls).toEqual([
                        [{ token: "pending-token", metadata: { authorizationRequest: ID, account: ACCOUNT } }],
                    ]);
                    expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
                } else {
                    expect(oauthCommands.completeAuthorization.mock.calls).toEqual([
                        [{ authorizationRequest: ID, account: ACCOUNT, acr: AuthenticationContextClass.PASSWORD }],
                    ]);
                    expect(pending2FACacheService.set).not.toHaveBeenCalled();
                }
            },
        );

        it("[case] - rejects an expired authorization request before checking credentials", async () => {
            // Arrange
            const { commands, oauthCommands, identifierRepository } = await helpers.commands();
            const failure = new Error("expired request");
            oauthCommands.assertAuthorizationPending.mockRejectedValue(failure);

            // Act
            const result = commands.password({
                input: { authorizationRequest: ID, identifier: "mail@example.test", password: "password" },
            });

            // Assert
            await expect(result).rejects.toBe(failure);
            expect(identifierRepository.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - requestOTP", () => {
        it.each([false, true])("[case] - issues login OTP only to a verified identifier: %s", async (isVerified) => {
            // Arrange
            const { commands, identifierRepository, cryptoService, otpCacheService, emit } = await helpers.commands();
            identifierRepository.findUnique.mockResolvedValue(
                helpers.createIdentifier({ id: "identifier-id", isVerified }),
            );
            cryptoService.generateOTP.mockReturnValue("123456");

            // Act
            const result = commands.requestOTP({
                input: { authorizationRequest: ID, identifier: "mail@example.test" },
                context: CONTEXT,
            });
            if (isVerified) {
                await result;
            } else {
                await Promise.allSettled([result]);
            }

            // Assert
            if (isVerified) {
                expect(otpCacheService.set.mock.calls).toEqual([
                    [
                        {
                            purpose: "login",
                            key: "123456",
                            value: JSON.stringify({ authorizationRequest: ID, identifier: "identifier-id" }),
                        },
                    ],
                ]);
                expect(emit).toHaveBeenCalledTimes(1);
            } else {
                await expect(result).rejects.toThrow();
                expect(otpCacheService.set).not.toHaveBeenCalled();
                expect(emit).not.toHaveBeenCalled();
            }
        });
    });

    describe("[Method] - verifyOTP", () => {
        it.each([
            { label: "missing", cached: null },
            {
                label: "bound to another request",
                cached: JSON.stringify({ authorizationRequest: "another-request", identifier: "identifier-id" }),
            },
        ])("[case] - rejects an OTP that is $label", async ({ cached }) => {
            // Arrange
            const { commands, otpCacheService, identifierRepository, oauthCommands } = await helpers.commands();
            otpCacheService.consume.mockResolvedValue(cached);

            // Act
            const result = commands.verifyOTP({ input: { code: "123456", authorizationRequest: ID } });

            // Assert
            await expect(result).rejects.toThrow();
            expect(identifierRepository.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
        });

        it("[case] - completes OTP login for the account resolved from the cached identifier", async () => {
            // Arrange
            const { commands, otpCacheService, identifierRepository, oauthCommands } = await helpers.commands();
            otpCacheService.consume.mockResolvedValue(
                JSON.stringify({ authorizationRequest: ID, identifier: "identifier-id" }),
            );
            identifierRepository.findUniqueOrThrow.mockResolvedValue(
                helpers.createIdentifier({ account: helpers.createAccount({ id: ACCOUNT }) }),
            );
            oauthCommands.completeAuthorization.mockResolvedValue({ authorizationUrl: "https://app.example.test/cb" });

            // Act
            await commands.verifyOTP({ input: { code: "123456", authorizationRequest: ID } });

            // Assert
            expect(identifierRepository.findUniqueOrThrow.mock.calls).toEqual([
                [{ options: { populate: ["account"] }, where: { id: "identifier-id" } }],
            ]);
            expect(oauthCommands.completeAuthorization.mock.calls).toEqual([
                [{ authorizationRequest: ID, account: ACCOUNT, acr: AuthenticationContextClass.OTP }],
            ]);
        });
    });

    describe("[Method] - verifySecondFactor", () => {
        it.each([undefined, "expired-token"])(
            "[case] - does not authenticate a second factor without valid pending state: %s",
            async (token) => {
                // Arrange
                const { commands, pending2FACacheService, secondFactorService, oauthCommands } = await helpers.commands();
                pending2FACacheService.get.mockResolvedValue(null);

                // Act
                const result = commands.verifySecondFactor({ token, input: { code: "123456" }, context: CONTEXT });

                // Assert
                await expect(result).rejects.toThrow();
                expect(secondFactorService.authenticate).not.toHaveBeenCalled();
                expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
            },
        );

        it.each([false, true])(
            "[case] - consumes pending state and completes MFA only after successful verification: %s",
            async (valid) => {
                // Arrange
                const { commands, pending2FACacheService, secondFactorService, oauthCommands, transaction } =
                    await helpers.commands();
                pending2FACacheService.get.mockResolvedValue({ account: ACCOUNT, authorizationRequest: "request-id" });
                const failure = new Error("invalid factor code");
                if (valid) {
                    secondFactorService.authenticate.mockResolvedValue(
                        helpers.createSecondFactor({ account: helpers.createAccount({ id: ACCOUNT }) }),
                    );
                } else {
                    secondFactorService.authenticate.mockRejectedValue(failure);
                }
                oauthCommands.completeAuthorization.mockResolvedValue({ authorizationUrl: "https://app.example.test/cb" });

                // Act
                const result = commands.verifySecondFactor({
                    token: "pending-token",
                    input: { code: "123456" },
                    context: CONTEXT,
                });
                if (valid) {
                    await result;
                } else {
                    await Promise.allSettled([result]);
                }

                // Assert
                if (valid) {
                    expect(pending2FACacheService.delete.mock.calls).toEqual([[{ token: "pending-token" }]]);
                    expect(oauthCommands.completeAuthorization.mock.calls).toEqual([
                        [{ authorizationRequest: "request-id", account: ACCOUNT, acr: AuthenticationContextClass.MFA }],
                    ]);
                } else {
                    await expect(result).rejects.toBe(failure);
                    expect(pending2FACacheService.delete).not.toHaveBeenCalled();
                    expect(oauthCommands.completeAuthorization).not.toHaveBeenCalled();
                }
                expect(secondFactorService.authenticate.mock.calls).toEqual([
                    [{ input: { account: ACCOUNT, code: "123456" }, transaction: transaction.entityManager }],
                ]);
            },
        );
    });
});
