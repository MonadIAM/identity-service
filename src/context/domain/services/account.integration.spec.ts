import { describe, expect, it } from "@jest/globals";

import { AccountIntegrationHelpers } from "~testing/integration/domain-service/account.helpers";
import { Account, Identifier, Password, Profile, Session } from "~context/domain/entities";
import { AccountStatus, AccountSubject, IdentifierType } from "~context/enums";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

const helpers = new AccountIntegrationHelpers();

async function loadAccount(suite: Integration.Domain.Account.Suite, account: Entities.Account): Promise<Entities.Account> {
    return await suite.transaction((transaction) =>
        transaction.findOneOrFail(Account, {
            id: account.id,
        }),
    );
}

async function loadIdentifiers(
    suite: Integration.Domain.Account.Suite,
    account: Entities.Account,
): Promise<Entities.Identifier[]> {
    return await suite.transaction((transaction) =>
        transaction.find(Identifier, { account: account.id }, { orderBy: { identity: "asc" } }),
    );
}

async function loadSessions(
    suite: Integration.Domain.Account.Suite,
    account: Entities.Account,
): Promise<Entities.Session[]> {
    return await suite.transaction((transaction) => transaction.find(Session, { account: account.id }));
}

async function loadProfile(suite: Integration.Domain.Account.Suite, account: Entities.Account): Promise<Entities.Profile> {
    return await suite.transaction((transaction) =>
        transaction.findOneOrFail(Profile, {
            account: account.id,
        }),
    );
}

async function loadPassword(
    suite: Integration.Domain.Account.Suite,
    account: Entities.Account,
): Promise<Nullable<Entities.Password>> {
    return await suite.transaction((transaction) =>
        transaction.findOne(Password, {
            account: account.id,
        }),
    );
}

async function countAccounts(suite: Integration.Domain.Account.Suite): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(Account, {}));
}

async function countProfiles(suite: Integration.Domain.Account.Suite): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(Profile, {}));
}

async function countPasswords(suite: Integration.Domain.Account.Suite): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(Password, {}));
}

describe("AccountService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates an account aggregate with profile, verified identifiers and password", async () => {
        const account = await suite.transaction(async (transaction) => {
            const created = await Promise.resolve(
                suite.repository().accountService.create({
                    input: {
                        primaryIdentifier: {
                            identity: "primary@example.test",
                            isVerified: true,
                            type: IdentifierType.EMAIL,
                        },
                        additionalIdentifier: {
                            identity: "+15550000001",
                            isVerified: true,
                            type: IdentifierType.PHONE,
                        },
                        profile: {
                            displayName: "Integration Account",
                            timeZone: "Europe/Moscow",
                            locale: "ru",
                        },
                        status: AccountStatus.PENDING,
                        subject: AccountSubject.HUMAN,
                        password: "hash:password",
                    },
                    transaction,
                }),
            );

            return created;
        });

        const persisted = await loadAccount(suite, account);
        const identifiers = await loadIdentifiers(suite, account);
        const profile = await loadProfile(suite, account);
        const password = await loadPassword(suite, account);

        expect(persisted).toMatchObject({
            status: AccountStatus.PENDING,
            subject: AccountSubject.HUMAN,
        });
        expect(profile).toMatchObject({
            displayName: "Integration Account",
            timeZone: "Europe/Moscow",
            locale: "ru",
        });
        expect(password?.hash).toBe("hash:password");
        expect(identifiers).toHaveLength(2);
        expect(identifiers.every(({ isVerified }) => isVerified)).toBe(true);
        expect(identifiers.every(({ verifiedAt }) => verifiedAt instanceof Date)).toBe(true);
    });

    it("rolls back account aggregate creation on duplicate identifier", async () => {
        const existing = await suite.fixtures().createAccount();
        await suite.fixtures().createIdentifier({
            identity: "duplicate@example.test",
            type: IdentifierType.EMAIL,
            account: existing,
        });

        await expect(
            suite.transaction(async (transaction) => {
                await Promise.resolve(
                    suite.repository().accountService.create({
                        input: {
                            primaryIdentifier: {
                                identity: "duplicate@example.test",
                                type: IdentifierType.EMAIL,
                            },
                            profile: {
                                displayName: "Duplicate Account",
                                timeZone: "Europe/Moscow",
                                locale: "ru",
                            },
                            status: AccountStatus.PENDING,
                            subject: AccountSubject.HUMAN,
                            password: "hash:password",
                        },
                        transaction,
                    }),
                );
            }),
        ).rejects.toThrow("identifier_type_identity_unique");

        await expect(countAccounts(suite)).resolves.toBe(1);
        await expect(countProfiles(suite)).resolves.toBe(0);
        await expect(countPasswords(suite)).resolves.toBe(0);
        await expect(loadIdentifiers(suite, existing)).resolves.toHaveLength(1);
    });

    it("activates a pending account", async () => {
        const pending = await suite.fixtures().createAccount({ status: AccountStatus.PENDING });

        await suite.transaction((transaction) =>
            suite.repository().accountService.verify({
                input: { account: pending.id },
                transaction,
            }),
        );

        const account = await loadAccount(suite, pending);

        expect(account.status).toBe(AccountStatus.ACTIVE);
        expect(account.updatedAt).toBeInstanceOf(Date);
    });

    it("suspends an account and removes its sessions", async () => {
        const account = await suite.fixtures().createAccount({ status: AccountStatus.ACTIVE });

        await suite.fixtures().createSession({ account });
        await suite.fixtures().createSession({ account });

        await suite.transaction((transaction) =>
            suite.repository().accountService.suspend({
                input: { account: account.id },
                transaction,
            }),
        );

        const persisted = await loadAccount(suite, account);

        expect(persisted.status).toBe(AccountStatus.SUSPENDED);
        await expect(loadSessions(suite, persisted)).resolves.toHaveLength(0);
    });

    it("unsuspends an account without removing sessions", async () => {
        const account = await suite.fixtures().createAccount({ status: AccountStatus.SUSPENDED });

        await suite.fixtures().createSession({ account });

        await suite.transaction((transaction) =>
            suite.repository().accountService.unsuspend({
                input: { account: account.id },
                transaction,
            }),
        );

        const persisted = await loadAccount(suite, account);

        expect(persisted.status).toBe(AccountStatus.ACTIVE);
        await expect(loadSessions(suite, persisted)).resolves.toHaveLength(1);
    });

    it("deactivates an account and removes its sessions", async () => {
        const account = await suite.fixtures().createAccount({ status: AccountStatus.ACTIVE });

        await suite.fixtures().createSession({ account });
        await suite.fixtures().createSession({ account });

        await suite.transaction((transaction) =>
            suite.repository().accountService.deactivate({
                input: { account: account.id },
                transaction,
            }),
        );

        const persisted = await loadAccount(suite, account);

        expect(persisted.status).toBe(AccountStatus.DEACTIVATED);
        await expect(loadSessions(suite, persisted)).resolves.toHaveLength(0);
    });
});
