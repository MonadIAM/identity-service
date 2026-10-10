import { describe, expect, it } from "@jest/globals";

import { AccountIntegrationHelpers } from "~testing/integration/domain-service/account.helpers";
import { Account, Identifier, Password, Profile, Session } from "~context/domain/entities";
import { AccountStatus, AccountSubject, IdentifierType } from "~context/enums";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

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

describe("[DomainService] - Account", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates an account aggregate with profile, verified identifiers and password", async () => {
            // Arrange

            // Act
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
            const result = identifiers.every(({ isVerified }) => isVerified);
            const result1 = identifiers.every(({ verifiedAt }) => verifiedAt instanceof Date);

            // Assert
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
            expect(result).toBe(true);
            expect(result1).toBe(true);
        });

        it("[case] - rolls back account aggregate creation on duplicate identifier", async () => {
            // Arrange
            const existing = await suite.fixtures().createAccount();
            await suite.fixtures().createIdentifier({
                identity: "duplicate@example.test",
                type: IdentifierType.EMAIL,
                account: existing,
            });

            // Act
            const result = suite.transaction(async (transaction) => {
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
            });
            await Promise.allSettled([result]);
            const result1 = await countAccounts(suite);
            const result2 = await countProfiles(suite);
            const result3 = await countPasswords(suite);
            const result4 = await loadIdentifiers(suite, existing);

            // Assert
            await expect(result).rejects.toThrow("identifier_type_identity_unique");
            expect(result1).toBe(1);
            expect(result2).toBe(0);
            expect(result3).toBe(0);
            expect(result4).toHaveLength(1);
        });
    });

    describe("[Method] - verify", () => {
        it("[case] - activates a pending account", async () => {
            // Arrange
            const pending = await suite.fixtures().createAccount({ status: AccountStatus.PENDING });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().accountService.verify({
                    input: { account: pending.id },
                    transaction,
                }),
            );
            const account = await loadAccount(suite, pending);

            // Assert
            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe("[Method] - suspend", () => {
        it("[case] - suspends an account and removes its sessions", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount({ status: AccountStatus.ACTIVE });
            await suite.fixtures().createSession({ account });
            await suite.fixtures().createSession({ account });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().accountService.suspend({
                    input: { account: account.id },
                    transaction,
                }),
            );
            const persisted = await loadAccount(suite, account);
            const result = await loadSessions(suite, persisted);

            // Assert
            expect(persisted.status).toBe(AccountStatus.SUSPENDED);
            expect(result).toHaveLength(0);
        });
    });

    describe("[Method] - unsuspend", () => {
        it("[case] - unsuspends an account without removing sessions", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount({ status: AccountStatus.SUSPENDED });
            await suite.fixtures().createSession({ account });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().accountService.unsuspend({
                    input: { account: account.id },
                    transaction,
                }),
            );
            const persisted = await loadAccount(suite, account);
            const result = await loadSessions(suite, persisted);

            // Assert
            expect(persisted.status).toBe(AccountStatus.ACTIVE);
            expect(result).toHaveLength(1);
        });
    });

    describe("[Method] - deactivate", () => {
        it("[case] - deactivates an account and removes its sessions", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount({ status: AccountStatus.ACTIVE });
            await suite.fixtures().createSession({ account });
            await suite.fixtures().createSession({ account });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().accountService.deactivate({
                    input: { account: account.id },
                    transaction,
                }),
            );
            const persisted = await loadAccount(suite, account);
            const result = await loadSessions(suite, persisted);

            // Assert
            expect(persisted.status).toBe(AccountStatus.DEACTIVATED);
            expect(result).toHaveLength(0);
        });
    });
});
