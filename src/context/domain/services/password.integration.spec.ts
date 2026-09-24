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

describe("PasswordService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("rotates a password and writes the previous hash to password history", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createPassword({ account, hash: "hash:current-password" });

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

        expect(password.hash).toBe("hash:new-password");
        expect(password.version).toBe(2);
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            version: 1,
            hash: "hash:current-password",
        });
    });

    it("does not rotate a password when the new password is in recent history", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createPassword({ account, hash: "hash:current-password" });
        await suite.fixtures().createPasswordHistory({ account, hash: "hash:new-password", version: 1 });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().passwordService.change({
                    input: {
                        currentPassword: "current-password",
                        newPassword: "new-password",
                        account: account.id,
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.password.RECENTLY_USED");

        const password = await loadPassword(suite, account);
        const history = await loadPasswordHistory(suite, account);

        expect(password.hash).toBe("hash:current-password");
        expect(password.version).toBe(1);
        expect(history).toHaveLength(1);
    });

    it("allows password rotation when matching history is outside the configured window", async () => {
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

        expect(password.hash).toBe("hash:new-password");
        expect(password.version).toBe(3);
        expect(entries).toHaveLength(2);
        expect(entries.map(({ hash }) => hash)).toEqual(["hash:new-password", current.hash]);
    });

    it("resets a password by OTP with the same rotation semantics", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createPassword({ account, hash: "hash:old-password" });

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

        expect(password.hash).toBe("hash:otp-password");
        expect(password.version).toBe(2);
        expect(history).toHaveLength(1);
        expect(history[0]?.hash).toBe("hash:old-password");
    });

    it("consumes only the matched unused recovery code while rotating the password", async () => {
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

        expect(password.hash).toBe("hash:recovered-password");
        expect(matchedCode?.usedAt).toBeInstanceOf(Date);
        expect(untouchedCode?.usedAt).toBeNull();
        expect(codes.find(({ hash }) => hash === "hash:already-used")?.usedAt).toBeInstanceOf(Date);
    });

    it("rolls back recovery code consumption and password rotation when history insert conflicts", async () => {
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

        await expect(
            suite.transaction((transaction) =>
                suite.repository().passwordService.resetByRecoveryCode({
                    input: {
                        identifier: "rollback@example.test",
                        password: "recovered-password",
                        code: "recovery-code",
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("password_history_account_version_unique");

        const password = await loadPassword(suite, account);
        const codes = await loadRecoveryCodes(suite, account);

        expect(password.hash).toBe("hash:old-password");
        expect(password.version).toBe(1);
        expect(codes.find(({ id }) => id === code.id)?.usedAt).toBeNull();
    });
});
