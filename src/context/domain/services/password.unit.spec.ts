import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { PasswordUnitHelpers } from "~testing/unit/domain-service/password.helpers";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID     = "00000000-0000-4000-8000-b00000000001";
const CODE_ID        = "00000000-0000-4000-8000-b00000000002";
const SECOND_CODE_ID = "00000000-0000-4000-8000-b00000000003";
/* eslint-enable prettier/prettier */

const IDENTITY = "user@example.com";

const helpers = new PasswordUnitHelpers();

function createAccountWithPassword(props: { hash?: string } = {}): {
    password: Entities.Password;
    account: Entities.Account;
} {
    const account = helpers.createAccount({ id: ACCOUNT_ID });
    const password = helpers.createPassword({ account, hash: props.hash ?? "stored-hash" });

    account.password = password;

    return { account, password };
}

describe("PasswordService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("change", () => {
        it("throws when the account has no password set", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            await expect(
                service.change({
                    input: { account: ACCOUNT_ID, currentPassword: "old", newPassword: "new" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.password.NO_PASSWORD_SET");

            expect(services.hashing.verify).not.toHaveBeenCalled();
        });

        it("throws when the current password does not match", async () => {
            const { account } = createAccountWithPassword();
            const { service, services, transaction } = helpers.service({ account });
            services.hashing.verify.mockImplementation(() => Promise.resolve(false));

            await expect(
                service.change({
                    input: { account: ACCOUNT_ID, currentPassword: "wrong", newPassword: "new" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.password.INVALID_CURRENT_PASSWORD");

            expect(services.hashing.verify).toHaveBeenCalledWith({
                storedHash: "stored-hash",
                value: "wrong",
            });
            expect(services.hashing.hash).not.toHaveBeenCalled();
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("checks reuse history, hashes the new password and rotates it", async () => {
            const { account, password } = createAccountWithPassword();
            const { service, services, transaction } = helpers.service({ account });
            const historySpy = jest.spyOn(service, "checkHistory");
            const rotateSpy = jest.spyOn(service, "rotate");

            await service.change({
                input: { account: ACCOUNT_ID, currentPassword: "old", newPassword: "new" },
                transaction: transaction.entityManager,
            });

            expect(historySpy).toHaveBeenCalledWith({ account: ACCOUNT_ID, password: "new" });
            expect(services.hashing.hash).toHaveBeenCalledWith({ value: "new" });
            expect(rotateSpy).toHaveBeenCalledTimes(1);
            expect(rotateSpy.mock.calls[0][0].input).toEqual({ password, newHash: "unit-new-hash" });
            expect(rotateSpy.mock.calls[0][0].transaction).toBe(transaction.entityManager);
        });
    });

    describe("resetByOTP", () => {
        it("throws when the account has no password set", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            await expect(
                service.resetByOTP({
                    input: { account: ACCOUNT_ID, password: "new" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.password.NO_PASSWORD_SET");

            expect(services.hashing.hash).not.toHaveBeenCalled();
        });

        it("checks reuse history before hashing and rotating the password", async () => {
            const { account, password } = createAccountWithPassword();
            const { service, services, transaction } = helpers.service({ account });
            const historySpy = jest.spyOn(service, "checkHistory");
            const rotateSpy = jest.spyOn(service, "rotate");

            await service.resetByOTP({
                input: { account: ACCOUNT_ID, password: "new" },
                transaction: transaction.entityManager,
            });

            expect(historySpy).toHaveBeenCalledWith({ account: ACCOUNT_ID, password: "new" });
            expect(historySpy.mock.invocationCallOrder[0]).toBeLessThan(services.hashing.hash.mock.invocationCallOrder[0]);
            expect(rotateSpy).toHaveBeenCalledTimes(1);
            expect(rotateSpy.mock.calls[0][0].input).toEqual({ password, newHash: "unit-new-hash" });
        });
    });

    describe("resetByRecoveryCode", () => {
        it("throws when no unused recovery code matches", async () => {
            const { account } = createAccountWithPassword();
            account.recoveryCodes = helpers.collection({ owner: account, items: [] });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            await expect(
                service.resetByRecoveryCode({
                    input: { identifier: IDENTITY, code: "recovery-code", password: "new" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.password.INVALID_RECOVERY_CODE");

            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("throws when the matched code belongs to an account without a password", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const code = helpers.createRecoveryCode({ id: CODE_ID, account });
            account.recoveryCodes = helpers.collection({ owner: account, items: [code] });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            await expect(
                service.resetByRecoveryCode({
                    input: { identifier: IDENTITY, code: "recovery-code", password: "new" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.password.NO_PASSWORD_SET");

            expect(code.usedAt).toBeUndefined();
        });

        it("consumes the matched code, checks history, rotates and returns the account", async () => {
            const { account } = createAccountWithPassword();
            const code = helpers.createRecoveryCode({ id: CODE_ID, account });
            account.recoveryCodes = helpers.collection({ owner: account, items: [code] });
            const { service, repositories, services, transaction } = helpers.service({ account });
            const historySpy = jest.spyOn(service, "checkHistory");
            const rotateSpy = jest.spyOn(service, "rotate");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            const result = await service.resetByRecoveryCode({
                input: { identifier: IDENTITY, code: "recovery-code", password: "new" },
                transaction: transaction.entityManager,
            });

            expect(repositories.identifiers.findUniqueOrThrow).toHaveBeenCalledWith({
                options: { populate: ["account.password", "account.recoveryCodes"] },
                transaction: transaction.entityManager,
                where: { identity: IDENTITY },
            });
            expect(historySpy).toHaveBeenCalledWith({ account: ACCOUNT_ID, password: "new" });
            expect(services.hashing.hash).toHaveBeenCalledWith({ value: "new" });
            expect(code.usedAt).toBeInstanceOf(Date);
            expect(rotateSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe(account);
        });

        it("matches against unused codes only", async () => {
            const { account } = createAccountWithPassword();
            const used = helpers.createRecoveryCode({ id: CODE_ID, account, usedAt: new Date() });
            const unused = helpers.createRecoveryCode({ id: SECOND_CODE_ID, account, hash: "unused-hash" });
            account.recoveryCodes = helpers.collection({ owner: account, items: [used, unused] });
            const { service, repositories, transaction } = helpers.service({ account });
            const matchSpy = jest.spyOn(service, "findMatchingRecoveryCode");
            repositories.identifiers.findUniqueOrThrow.mockImplementation(() =>
                Promise.resolve(helpers.createIdentifier({ account, identity: IDENTITY })),
            );

            await service.resetByRecoveryCode({
                input: { identifier: IDENTITY, code: "recovery-code", password: "new" },
                transaction: transaction.entityManager,
            });

            expect(matchSpy).toHaveBeenCalledTimes(1);
            expect(matchSpy.mock.calls[0][0].plaintext).toBe("recovery-code");
            expect(matchSpy.mock.calls[0][0].codes).toHaveLength(1);
            expect(matchSpy.mock.calls[0][0].codes[0]).toBe(unused);
        });
    });

    describe("rotate", () => {
        it("stores the previous hash and version in the password history", () => {
            const { account, password } = createAccountWithPassword({ hash: "previous-hash" });
            const { service, transaction } = helpers.service({ account });

            service.rotate({
                input: { password, newHash: "next-hash" },
                transaction: transaction.entityManager,
            });

            expect(password.hash).toBe("next-hash");
            expect(transaction.persist).toHaveBeenCalledWith(
                expect.objectContaining({
                    hash: "previous-hash",
                    version: 1,
                    account,
                }),
            );
        });
    });

    describe("checkHistory", () => {
        it("throws when the new password matches a recently used hash", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, transaction } = helpers.service({ account });
            repositories.passwordHistories.find.mockImplementation(() =>
                Promise.resolve([helpers.createPasswordHistory({ account, hash: "recent-hash" })]),
            );

            await expect(service.checkHistory({ account: ACCOUNT_ID, password: "new" })).rejects.toThrow(
                "services.password.RECENTLY_USED",
            );

            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("passes when no recent hash matches", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, repositories, services } = helpers.service({ account });
            services.hashing.verify.mockImplementation(() => Promise.resolve(false));
            repositories.passwordHistories.find.mockImplementation(() =>
                Promise.resolve([helpers.createPasswordHistory({ account, hash: "recent-hash" })]),
            );

            await expect(service.checkHistory({ account: ACCOUNT_ID, password: "new" })).resolves.toBeUndefined();
        });
    });

    describe("findMatchingRecoveryCode", () => {
        it("returns the entry whose hash matches the plaintext", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const first = helpers.createRecoveryCode({ id: CODE_ID, account, hash: "first-hash" });
            const second = helpers.createRecoveryCode({ id: SECOND_CODE_ID, account, hash: "second-hash" });
            const { service, services } = helpers.service({ account });
            services.hashing.verify.mockImplementation(({ storedHash }) => {
                return Promise.resolve(storedHash === "second-hash");
            });

            const result = await service.findMatchingRecoveryCode({
                plaintext: "recovery-code",
                codes: [first, second],
            });

            expect(result).toBe(second);
        });

        it("returns null when no hash matches", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const code = helpers.createRecoveryCode({ id: CODE_ID, account });
            const { service, services } = helpers.service({ account });
            services.hashing.verify.mockImplementation(() => Promise.resolve(false));

            const result = await service.findMatchingRecoveryCode({ plaintext: "recovery-code", codes: [code] });

            expect(result).toBeNull();
        });
    });
});
