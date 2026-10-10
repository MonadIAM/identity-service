import { describe, expect, it } from "@jest/globals";

import { PasswordCommandsUnitHelpers } from "~testing/unit/command-services/password.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new PasswordCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("[Commands] - Password", () => {
    describe("[Method] - change", () => {
        it("[case] - changes only the authenticated account's password", async () => {
            // Arrange
            const { commands, passwordService, transaction } = await helpers.commands();
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
                const { commands, identifierRepository, cryptoService, otpCacheService, emit } = await helpers.commands();
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
            const { commands, otpCacheService, passwordService, transaction, run } = await helpers.commands();
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
            const { commands, passwordService, transaction, run } = await helpers.commands();
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
