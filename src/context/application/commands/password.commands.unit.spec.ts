import { describe, expect, it } from "@jest/globals";

import { PasswordCommandsUnitHelpers } from "~testing/unit/command-services/password.helpers";
import { ActionType, EntityType, KafkaTopic, NotificationTopicAction } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new PasswordCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("[Commands] - Password", () => {
    describe("[Method] - set", () => {
        it("[case] - hashes before the transaction and sets the authenticated account password", async () => {
            // Arrange
            const { commands, hashingService, passwordService, transaction, run } = helpers.commands();
            hashingService.hash.mockResolvedValue("prepared-hash");
            const input = { password: "new-password" };

            // Act
            const result = await commands.set({ input, actor: ACTOR, context: CONTEXT });

            // Assert
            expect(result).toEqual({ message: "commands.password.SET" });
            expect(hashingService.hash).toHaveBeenCalledWith({ value: input.password });
            expect(hashingService.hash.mock.invocationCallOrder[0]).toBeLessThan(run.mock.invocationCallOrder[0]);
            expect(passwordService.set).toHaveBeenCalledWith({
                input: { account: ACTOR, hash: "prepared-hash" },
                transaction: transaction.entityManager,
            });
            expect(run).toHaveBeenCalledWith(
                expect.objectContaining({
                    resource: "Password",
                    changeLog: true,
                    audit: {
                        entityType: EntityType.PASSWORD,
                        actionType: ActionType.CREATE,
                        context: CONTEXT,
                        actor: ACTOR,
                        input,
                    },
                    outbox: expect.objectContaining({
                        destinationTopic: KafkaTopic.NOTIFICATION,
                        actionType: NotificationTopicAction.CREATE,
                    }),
                }),
            );
            await expect(run.mock.results[0].value).resolves.toEqual({ account: ACTOR });
        });

        it("[case] - does not start a transaction if hashing fails", async () => {
            // Arrange
            const { commands, hashingService, passwordService, run } = helpers.commands();
            const error = new Error("Hashing failed");
            hashingService.hash.mockRejectedValue(error);

            // Act
            const result = commands.set({ input: { password: "new-password" }, actor: ACTOR, context: CONTEXT });

            // Assert
            await expect(result).rejects.toBe(error);
            expect(run).not.toHaveBeenCalled();
            expect(passwordService.set).not.toHaveBeenCalled();
        });

        it("[case] - propagates password creation failure", async () => {
            // Arrange
            const { commands, hashingService, passwordService } = helpers.commands();
            const error = new Error("Password already set");
            hashingService.hash.mockResolvedValue("prepared-hash");
            passwordService.set.mockRejectedValue(error);

            // Act
            const result = commands.set({ input: { password: "new-password" }, actor: ACTOR, context: CONTEXT });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });

    describe("[Method] - change", () => {
        it("[case] - changes only the authenticated account's password", async () => {
            // Arrange
            const { commands, passwordService, transaction } = helpers.commands();
            const input = { currentPassword: "old", newPassword: "new" };

            // Act
            await commands.change({ input, actor: ACTOR, context: CONTEXT });

            // Assert
            expect(passwordService.change.mock.calls).toEqual([
                [{ input: { ...input, account: ACTOR }, transaction: transaction.entityManager }],
            ]);
        });
    });

    describe("[Method] - requestOTP", () => {
        it.each(["missing", "unverified", "verified"])(
            "[case] - keeps the reset response identical for a %s identifier",
            async (state) => {
                // Arrange
                const { commands, identifierRepository, cryptoService, otpCacheService, emit } = helpers.commands();
                identifierRepository.findUnique.mockResolvedValue(
                    state === "missing"
                        ? null
                        : helpers.createIdentifier({
                              account: helpers.createAccount({ id: ACCOUNT }),
                              isVerified: state === "verified",
                          }),
                );
                cryptoService.generateOTP.mockReturnValue("123456");

                // Act
                const result = await commands.requestOTP({ input: { identifier: "mail@example.test" }, context: CONTEXT });

                // Assert
                expect(result).toEqual({ message: "commands.password.RESET_CODE_SENT" });
                if (state === "verified") {
                    expect(otpCacheService.set.mock.calls).toEqual([[{ purpose: "reset", value: ACCOUNT, key: "123456" }]]);
                    expect(emit).toHaveBeenCalledTimes(1);
                } else {
                    expect(otpCacheService.set).not.toHaveBeenCalled();
                    expect(emit).not.toHaveBeenCalled();
                }
            },
        );
    });

    describe("[Method] - resetByOTP", () => {
        it.each([ACCOUNT, null])("[case] - resets only the account bound to a valid OTP: %s", async (cached) => {
            // Arrange
            const { commands, otpCacheService, passwordService, transaction, run } = helpers.commands();
            otpCacheService.consume.mockResolvedValue(cached);

            // Act
            const result = commands.resetByOTP({ input: { code: "123456", password: "new" }, context: CONTEXT });
            if (cached) {
                await result;
            } else {
                await Promise.allSettled([result]);
            }

            // Assert
            if (cached) {
                expect(passwordService.resetByOTP.mock.calls).toEqual([
                    [{ input: { password: "new", account: ACCOUNT }, transaction: transaction.entityManager }],
                ]);
            } else {
                await expect(result).rejects.toThrow();
                expect(run).not.toHaveBeenCalled();
            }
            expect(otpCacheService.consume.mock.calls).toEqual([[{ purpose: "reset", key: "123456" }]]);
        });
    });

    describe("[Method] - resetByRecoveryCode", () => {
        it("[case] - uses the account resolved by recovery-code validation for the notification", async () => {
            // Arrange
            const { commands, passwordService, transaction, run } = helpers.commands();
            passwordService.resetByRecoveryCode.mockResolvedValue(helpers.createAccount({ id: ACCOUNT }));
            const input = { identifier: "mail@example.test", password: "new", code: "recovery" };

            // Act
            await commands.resetByRecoveryCode({ input, context: CONTEXT });
            const result = await run.mock.results[0]?.value;

            // Assert
            expect(passwordService.resetByRecoveryCode.mock.calls).toEqual([
                [{ input, transaction: transaction.entityManager }],
            ]);
            expect(result).toEqual(expect.objectContaining({ account: ACCOUNT }));
        });
    });
});
