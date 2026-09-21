import { describe, expect, it } from "@jest/globals";

import { PasswordCommandsUnitHelpers } from "~testing/unit/command-services/password.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new PasswordCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("PasswordCommands", () => {
    it("changes only the authenticated account's password", async () => {
        const { commands, passwordService, transaction } = await helpers.commands();
        const input = { currentPassword: "old", newPassword: "new" };

        await commands.change({ input, actor: ACTOR, context: CONTEXT });

        expect(passwordService.change.mock.calls).toEqual([
            [{ input: { ...input, account: ACTOR }, transaction: transaction.entityManager }],
        ]);
    });

    it.each(["missing", "unverified", "verified"])(
        "keeps the reset response identical for a %s identifier",
        async (state) => {
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

            const result = await commands.requestOTP({ input: { identifier: "mail@example.test" }, context: CONTEXT });

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

    it.each([ACCOUNT, null])("resets only the account bound to a valid OTP: %s", async (cached) => {
        const { commands, otpCacheService, passwordService, transaction, run } = await helpers.commands();
        otpCacheService.consume.mockResolvedValue(cached);

        const result = commands.resetByOTP({ input: { code: "123456", password: "new" }, context: CONTEXT });

        if (cached) {
            await result;
            expect(passwordService.resetByOTP.mock.calls).toEqual([
                [{ input: { password: "new", account: ACCOUNT }, transaction: transaction.entityManager }],
            ]);
        } else {
            await expect(result).rejects.toThrow();
            expect(run).not.toHaveBeenCalled();
        }
        expect(otpCacheService.consume.mock.calls).toEqual([[{ purpose: "reset", key: "123456" }]]);
    });

    it("uses the account resolved by recovery-code validation for the notification", async () => {
        const { commands, passwordService, transaction, run } = await helpers.commands();
        passwordService.resetByRecoveryCode.mockResolvedValue(helpers.createAccount({ id: ACCOUNT }));
        const input = { identifier: "mail@example.test", password: "new", code: "recovery" };

        await commands.resetByRecoveryCode({ input, context: CONTEXT });

        expect(passwordService.resetByRecoveryCode.mock.calls).toEqual([
            [{ input, transaction: transaction.entityManager }],
        ]);
        await expect(run.mock.results[0]?.value).resolves.toEqual(expect.objectContaining({ account: ACCOUNT }));
    });
});
