import { describe, expect, it } from "@jest/globals";

import { AccountCommandsUnitHelpers } from "~testing/unit/command-services/account.helpers";
import { IdentifierType, AccountSubject, AccountStatus } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new AccountCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";

describe("AccountCommands", () => {
    it.each([
        { identifier: "mail@example.test", type: IdentifierType.EMAIL },
        { identifier: "+79991234567", type: IdentifierType.PHONE },
    ])(
        "registers $type using a password hash and caches verification for the new account",
        async ({ identifier, type }) => {
            const { commands, accountService, hashingService, cryptoService, otpCacheService, transaction, run } =
                await helpers.commands();
            hashingService.hash.mockResolvedValue("password-hash");
            cryptoService.generateOTP.mockReturnValue("123456");
            accountService.create.mockReturnValue(helpers.createAccount({ id: ACCOUNT }));

            await commands.signup({
                input: { identifier, password: "plain-password", name: "New User" },
                context: CONTEXT,
            });

            expect(hashingService.hash.mock.calls).toEqual([[{ value: "plain-password" }]]);
            expect(accountService.create.mock.calls).toEqual([
                [
                    {
                        input: {
                            primaryIdentifier: { identity: identifier, type },
                            profile: { displayName: "New User" },
                            subject: AccountSubject.HUMAN,
                            status: AccountStatus.PENDING,
                            password: "password-hash",
                        },
                        transaction: transaction.entityManager,
                    },
                ],
            ]);
            expect(otpCacheService.set.mock.calls).toEqual([[{ purpose: "verification", value: ACCOUNT, key: "123456" }]]);
            await expect(run.mock.results[0]?.value).resolves.toEqual({ account: ACCOUNT, otp: "123456" });
        },
    );

    it("does not cache verification if account creation fails", async () => {
        const { commands, accountService, hashingService, otpCacheService } = await helpers.commands();
        hashingService.hash.mockResolvedValue("hash");
        const failure = new Error("duplicate identifier");
        accountService.create.mockImplementation(() => {
            throw failure;
        });

        await expect(
            commands.signup({
                input: { identifier: "mail@example.test", password: "plain", name: "User" },
                context: CONTEXT,
            }),
        ).rejects.toBe(failure);

        expect(otpCacheService.set).not.toHaveBeenCalled();
    });

    it.each([false, true])("resends verification only for an unverified identifier: %s", async (isVerified) => {
        const { commands, identifierRepository, otpCacheService, cryptoService, emit } = await helpers.commands();
        identifierRepository.findUniqueOrThrow.mockResolvedValue(
            helpers.createIdentifier({ account: helpers.createAccount({ id: ACCOUNT }), isVerified }),
        );
        cryptoService.generateOTP.mockReturnValue("123456");

        const result = commands.resend({ input: { identifier: "mail@example.test" }, context: CONTEXT });

        if (isVerified) {
            await expect(result).rejects.toThrow();
            expect(otpCacheService.set).not.toHaveBeenCalled();
            expect(emit).not.toHaveBeenCalled();
        } else {
            await result;
            expect(otpCacheService.set.mock.calls).toEqual([[{ purpose: "verification", value: ACCOUNT, key: "123456" }]]);
            expect(emit).toHaveBeenCalledTimes(1);
        }
    });

    it("verifies the cached account and persists hashed recovery codes in the same transaction", async () => {
        const {
            commands,
            accountService,
            otpCacheService,
            cryptoService,
            hashingService,
            recoveryCodeService,
            transaction,
        } = await helpers.commands();
        const account = helpers.createAccount({ id: ACCOUNT });
        otpCacheService.consume.mockResolvedValue(ACCOUNT);
        cryptoService.generateRecoveryCodes.mockReturnValue(["first", "second"]);
        hashingService.hash.mockImplementation(({ value }) => Promise.resolve(`hash:${value}`));
        accountService.verify.mockResolvedValue(account);

        const result = await commands.verify({ input: { code: "123456" }, context: CONTEXT });

        expect(otpCacheService.consume.mock.calls).toEqual([[{ purpose: "verification", key: "123456" }]]);
        expect(accountService.verify.mock.calls).toEqual([
            [{ input: { account: ACCOUNT }, transaction: transaction.entityManager }],
        ]);
        expect(recoveryCodeService.generate.mock.calls).toEqual([
            [{ input: { account, hashes: ["hash:first", "hash:second"] }, transaction: transaction.entityManager }],
        ]);
        expect(result.codes).toEqual(["first", "second"]);
    });

    it("rejects an expired verification code before changing the account", async () => {
        const { commands, otpCacheService, run, recoveryCodeService } = await helpers.commands();
        otpCacheService.consume.mockResolvedValue(null);

        await expect(commands.verify({ input: { code: "expired" }, context: CONTEXT })).rejects.toThrow();

        expect(run).not.toHaveBeenCalled();
        expect(recoveryCodeService.generate).not.toHaveBeenCalled();
    });

    it("deactivates the actor's own account", async () => {
        const { commands, accountService, transaction } = await helpers.commands();

        await commands.deactivate({ actor: ACTOR, context: CONTEXT });

        expect(accountService.deactivate.mock.calls).toEqual([
            [{ input: { account: ACTOR }, transaction: transaction.entityManager }],
        ]);
    });

    it.each([
        { command: "suspend", method: "suspend" },
        { command: "restore", method: "unsuspend" },
    ] as const)("$command targets the administratively selected account", async ({ command, method }) => {
        const { commands, accountService, transaction } = await helpers.commands();

        await commands[command]({ input: { account: ACCOUNT, reason: "Review" }, actor: ACTOR, context: CONTEXT });

        expect(accountService[method].mock.calls).toEqual([
            [{ input: { account: ACCOUNT }, transaction: transaction.entityManager }],
        ]);
    });
});
