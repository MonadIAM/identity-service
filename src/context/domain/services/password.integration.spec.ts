import { describe, expect, it } from "@jest/globals";

import { PasswordIntegrationHelpers } from "~testing/integration/domain-service/password.helpers";
import { Password, PasswordHistory, RecoveryCode } from "~context/domain/entities";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { IdentifierType } from "~context/enums";

const helpers = new PasswordIntegrationHelpers();

async function loadPassword(
    suite: Integration.Domain.Password.Suite,
    account: Entities.Account,
): Promise<Entities.Password> {
    return await suite.transaction((transaction) =>
        transaction.findOneOrFail(Password, {
            account: account.id,
        }),
    );
}

async function loadPasswordHistory(
    suite: Integration.Domain.Password.Suite,
    account: Entities.Account,
): Promise<Entities.PasswordHistory[]> {
    return await suite.transaction((transaction) =>
        transaction.find(PasswordHistory, { account: account.id }, { orderBy: { version: "asc" } }),
    );
}

async function loadRecoveryCodes(
    suite: Integration.Domain.Password.Suite,
    account: Entities.Account,
): Promise<Entities.RecoveryCode[]> {
    return await suite.transaction((transaction) =>
        transaction.find(RecoveryCode, { account: account.id }, { orderBy: { hash: "asc" } }),
    );
}

describe("[DomainService] - Password", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - set", () => {
        it("[case] - persists the first password and its account relation", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();

            // Act
            await suite.transaction((transaction) =>
                suite.repository().passwordService.set({
                    input: { account: account.id, hash: "hash:first-password" },
                    transaction,
                }),
            );
            const password = await loadPassword(suite, account);

            // Assert
            expect(password.hash).toBe("hash:first-password");
            expect(password.account.id).toBe(account.id);
            expect(password.version).toBe(1);
            await expect(loadPasswordHistory(suite, account)).resolves.toEqual([]);
        });

        it("[case] - preserves an existing password when a second installation is attempted", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createPassword({ account, hash: "hash:existing-password" });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().passwordService.set({
                    input: { account: account.id, hash: "hash:replacement-password" },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const password = await loadPassword(suite, account);

            // Assert
            await expect(result).rejects.toThrow("services.password.PASSWORD_ALREADY_SET");
            expect(password.hash).toBe("hash:existing-password");
            expect(password.version).toBe(1);
        });
    });

    describe("[Method] - change", () => {
        it("[case] - rotates a password and writes the previous hash to password history", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createPassword({ account, hash: "hash:current-password" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().passwordService.change({
                    input: {
                        currentPassword: "current-password",
                        newPassword: "new-password",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const password = await loadPassword(suite, account);
            const history = await loadPasswordHistory(suite, account);

            // Assert
            expect(password.hash).toBe("hash:new-password");
            expect(password.version).toBe(2);
            expect(history).toHaveLength(1);
            expect(history[0]).toMatchObject({
                version: 1,
                hash: "hash:current-password",
            });
        });

        it("[case] - does not rotate a password when the new password is in recent history", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createPassword({ account, hash: "hash:current-password" });
            await suite.fixtures().createPasswordHistory({ account, hash: "hash:new-password", version: 1 });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().passwordService.change({
                    input: {
                        currentPassword: "current-password",
                        newPassword: "new-password",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const password = await loadPassword(suite, account);
            const history = await loadPasswordHistory(suite, account);

            // Assert
            await expect(result).rejects.toThrow("services.password.RECENTLY_USED");
            expect(password.hash).toBe("hash:current-password");
            expect(password.version).toBe(1);
            expect(history).toHaveLength(1);
        });

        it("[case] - allows password rotation when matching history is outside the configured window", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const history = await suite.fixtures().createPasswordHistory({
                account,
                hash: "hash:new-password",
                version: 1,
            });
            const current = await suite.fixtures().createPassword({ account, hash: "hash:current-password" });
            await suite.transaction(async (transaction) => {
                const entity = await transaction.findOneOrFail(PasswordHistory, { id: history.id });
                entity.setAt = new Date("2025-01-01T00:00:00.000Z");
                const password = await transaction.findOneOrFail(Password, { account: account.id });
                password.version = 2;
                await transaction.flush();
            });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().passwordService.change({
                    input: {
                        currentPassword: "current-password",
                        newPassword: "new-password",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const password = await loadPassword(suite, account);
            const entries = await loadPasswordHistory(suite, account);
            const result = entries.map(({ hash }) => hash);

            // Assert
            expect(password.hash).toBe("hash:new-password");
            expect(password.version).toBe(3);
            expect(entries).toHaveLength(2);
            expect(result).toEqual(["hash:new-password", current.hash]);
        });
    });

    describe("[Method] - resetByOTP", () => {
        it("[case] - resets a password by OTP with the same rotation semantics", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createPassword({ account, hash: "hash:old-password" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().passwordService.resetByOTP({
                    input: {
                        password: "otp-password",
                        account: account.id,
                    },
                    transaction,
                }),
            );
            const password = await loadPassword(suite, account);
            const history = await loadPasswordHistory(suite, account);

            // Assert
            expect(password.hash).toBe("hash:otp-password");
            expect(password.version).toBe(2);
            expect(history).toHaveLength(1);
            expect(history[0]?.hash).toBe("hash:old-password");
        });
    });

    describe("[Method] - resetByRecoveryCode", () => {
        it("[case] - consumes only the matched unused recovery code while rotating the password", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createPassword({ account, hash: "hash:old-password" });
            await suite.fixtures().createIdentifier({
                identity: "owner@example.test",
                type: IdentifierType.EMAIL,
                isVerified: true,
                account,
            });
            await suite.fixtures().createRecoveryCode({ account, hash: "hash:already-used", used: true });
            const matched = await suite.fixtures().createRecoveryCode({ account, hash: "hash:recovery-code" });
            const untouched = await suite.fixtures().createRecoveryCode({ account, hash: "hash:other-code" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().passwordService.resetByRecoveryCode({
                    input: {
                        identifier: "owner@example.test",
                        password: "recovered-password",
                        code: "recovery-code",
                    },
                    transaction,
                }),
            );
            const password = await loadPassword(suite, account);
            const codes = await loadRecoveryCodes(suite, account);
            const matchedCode = codes.find(({ id }) => id === matched.id);
            const untouchedCode = codes.find(({ id }) => id === untouched.id);
            const result = codes.find(({ hash }) => hash === "hash:already-used")?.usedAt;

            // Assert
            expect(password.hash).toBe("hash:recovered-password");
            expect(matchedCode?.usedAt).toBeInstanceOf(Date);
            expect(untouchedCode?.usedAt).toBeNull();
            expect(result).toBeInstanceOf(Date);
        });

        it("[case] - rolls back recovery code consumption and password rotation when history insert conflicts", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            await suite.fixtures().createPassword({ account, hash: "hash:old-password" });
            await suite.fixtures().createPasswordHistory({ account, hash: "hash:previous-password", version: 1 });
            await suite.fixtures().createIdentifier({
                identity: "rollback@example.test",
                type: IdentifierType.EMAIL,
                isVerified: true,
                account,
            });
            const code = await suite.fixtures().createRecoveryCode({ account, hash: "hash:recovery-code" });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().passwordService.resetByRecoveryCode({
                    input: {
                        identifier: "rollback@example.test",
                        password: "recovered-password",
                        code: "recovery-code",
                    },
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const password = await loadPassword(suite, account);
            const codes = await loadRecoveryCodes(suite, account);
            const result1 = codes.find(({ id }) => id === code.id)?.usedAt;

            // Assert
            await expect(result).rejects.toThrow("password_history_account_version_unique");
            expect(password.hash).toBe("hash:old-password");
            expect(password.version).toBe(1);
            expect(result1).toBeNull();
        });
    });
});
