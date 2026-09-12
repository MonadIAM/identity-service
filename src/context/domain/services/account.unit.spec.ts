import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { AccountUnitHelpers } from "~testing/unit/domain-service/account.helpers";
import { AccountStatus, AccountSubject, IdentifierType } from "~context/enums";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID        = "00000000-0000-4000-8000-100000000001";
const SESSION_ID        = "00000000-0000-4000-8000-100000000002";
const SECOND_SESSION_ID = "00000000-0000-4000-8000-100000000003";
/* eslint-enable prettier/prettier */

const helpers = new AccountUnitHelpers();

function createProps(
    transaction: ORM.EntityManager,
    overrides: Partial<Services.Account.Create.Props["input"]> = {},
): Services.Account.Create.Props {
    return {
        transaction,
        input: {
            primaryIdentifier: { identity: "primary@example.com", type: IdentifierType.EMAIL },
            profile: { displayName: "Unit Account", timeZone: "Europe/Moscow", locale: "ru" },
            status: AccountStatus.PENDING,
            subject: AccountSubject.HUMAN,
            ...overrides,
        },
    };
}

function createAccountWithSessions(): {
    sessions: Entities.Session[];
    account: Entities.Account;
} {
    const account = helpers.createAccount({ id: ACCOUNT_ID });
    const sessions = [
        helpers.createSession({ id: SECOND_SESSION_ID, account }),
        helpers.createSession({ id: SESSION_ID, account }),
    ];

    account.sessions = helpers.collection({ owner: account, items: sessions });

    return { account, sessions };
}

describe("AccountService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("persists the account aggregate with profile, primary identifier and password", () => {
            const { service, transaction } = helpers.service();

            const account = service.create(createProps(transaction.entityManager, { password: "argon2-hash" }));

            expect(account).toEqual(
                expect.objectContaining({
                    status: AccountStatus.PENDING,
                    subject: AccountSubject.HUMAN,
                }),
            );
            expect(account.profile).toEqual(
                expect.objectContaining({
                    displayName: "Unit Account",
                    timeZone: "Europe/Moscow",
                    locale: "ru",
                    account,
                }),
            );
            expect(account.password).toEqual(expect.objectContaining({ hash: "argon2-hash", account }));
            expect(transaction.persist).toHaveBeenNthCalledWith(1, account);
            expect(transaction.persist).toHaveBeenNthCalledWith(2, account.profile);
            expect(transaction.persist).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    identity: "primary@example.com",
                    type: IdentifierType.EMAIL,
                    account,
                }),
            );
            expect(transaction.persist).toHaveBeenNthCalledWith(4, account.password);
            expect(transaction.persist).toHaveBeenCalledTimes(4);
        });

        it("persists a second identifier bound to the same account when an additional one is given", () => {
            const { service, transaction } = helpers.service();

            const account = service.create(
                createProps(transaction.entityManager, {
                    additionalIdentifier: { identity: "+70000000000", type: IdentifierType.PHONE },
                }),
            );

            expect(transaction.persist).toHaveBeenCalledTimes(4);
            expect(transaction.persist).toHaveBeenNthCalledWith(
                4,
                expect.objectContaining({
                    type: IdentifierType.PHONE,
                    identity: "+70000000000",
                    account,
                }),
            );
            expect(account.password).toBeUndefined();
        });
    });

    describe("verify", () => {
        it("finds the account and activates it", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID, status: AccountStatus.PENDING });
            const { service, repositories, transaction } = helpers.service({ account });
            const activateSpy = jest.spyOn(account, "activate");

            const result = await service.verify({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: ACCOUNT_ID },
            });
            expect(activateSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe(account);
        });
    });

    describe("deactivate", () => {
        it("removes every active session before deactivating the account", async () => {
            const { account, sessions } = createAccountWithSessions();
            const { service, repositories, transaction } = helpers.service({ account });
            const deactivateSpy = jest.spyOn(account, "deactivate");

            await service.deactivate({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                options: { populate: ["sessions"] },
                where: { id: ACCOUNT_ID },
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, sessions[0]);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, sessions[1]);
            expect(deactivateSpy).toHaveBeenCalledTimes(1);
            expect(account.status).toBe(AccountStatus.DEACTIVATED);
        });
    });

    describe("suspend", () => {
        it("removes every active session, suspends the account and returns it", async () => {
            const { account, sessions } = createAccountWithSessions();
            const { service, transaction } = helpers.service({ account });
            const suspendSpy = jest.spyOn(account, "suspend");

            const result = await service.suspend({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(transaction.remove).toHaveBeenNthCalledWith(1, sessions[0]);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, sessions[1]);
            expect(suspendSpy).toHaveBeenCalledTimes(1);
            expect(account.status).toBe(AccountStatus.SUSPENDED);
            expect(result).toBe(account);
        });
    });

    describe("unsuspend", () => {
        it("finds the account and unsuspends it without touching sessions", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID, status: AccountStatus.SUSPENDED });
            const { service, repositories, transaction } = helpers.service({ account });
            const unsuspendSpy = jest.spyOn(account, "unsuspend");

            const result = await service.unsuspend({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: ACCOUNT_ID },
            });
            expect(unsuspendSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).not.toHaveBeenCalled();
            expect(result).toBe(account);
        });
    });
});
