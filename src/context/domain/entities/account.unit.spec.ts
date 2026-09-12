import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AccountSubject, AccountStatus } from "~context/enums";

import { Identifier } from "./identifier.entity";
import { Password } from "./password.entity";
import { Account } from "./account.entity";
import { Profile } from "./profile.entity";

function createAccount(overrides?: Partial<Entities.Account.ConstructorProps>): Account {
    return new Account({
        subject: AccountSubject.HUMAN,
        status: AccountStatus.PENDING,
        ...overrides,
    });
}

describe("Account Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = createAccount({
                subject: AccountSubject.SERVICE,
                status: AccountStatus.ACTIVE,
            });

            expect(account.subject).toBe(AccountSubject.SERVICE);
            expect(account.status).toBe(AccountStatus.ACTIVE);
        });

        it("should default is2FAEnforced to false", () => {
            const account = createAccount();

            expect(account.is2FAEnforced).toBe(false);
        });

        it("should auto-generate id, createdAt, version", () => {
            const account = createAccount();

            expect(isUUID(account.id, "4")).toBe(true);
            expect(account.createdAt).toBeInstanceOf(Date);
            expect(account.version).toBe(1);
            expect(account.updatedAt).toBeUndefined();
            expect(account.lastActiveAt).toBeUndefined();
        });
    });

    describe("touch", () => {
        it("should set lastActiveAt", () => {
            const account = createAccount();
            account.touch();

            expect(account.lastActiveAt).toBeInstanceOf(Date);
        });
    });

    describe("activate", () => {
        it("should activate a pending account", () => {
            const account = createAccount({ status: AccountStatus.PENDING });
            account.activate();

            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when account is not pending", () => {
            const account = createAccount({ status: AccountStatus.ACTIVE });

            expect(() => account.activate()).toThrow("ALREADY_ACTIVATED");
        });
    });

    describe("deactivate", () => {
        it("should deactivate an active account", () => {
            const account = createAccount({ status: AccountStatus.ACTIVE });
            account.deactivate();

            expect(account.status).toBe(AccountStatus.DEACTIVATED);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when account is not active", () => {
            const account = createAccount({ status: AccountStatus.PENDING });

            expect(() => account.deactivate()).toThrow("DEACTIVATION_NOT_ALLOWED");
        });
    });

    describe("restore", () => {
        it("should restore a deactivated account", () => {
            const account = createAccount({ status: AccountStatus.DEACTIVATED });
            account.restore();

            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when account is not deactivated", () => {
            const account = createAccount({ status: AccountStatus.ACTIVE });

            expect(() => account.restore()).toThrow("RESTORE_NOT_ALLOWED");
        });
    });

    describe("suspend", () => {
        it("should suspend an active account", () => {
            const account = createAccount({ status: AccountStatus.ACTIVE });
            account.suspend();

            expect(account.status).toBe(AccountStatus.SUSPENDED);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when account is already suspended", () => {
            const account = createAccount({ status: AccountStatus.SUSPENDED });

            expect(() => account.suspend()).toThrow("ALREADY_SUSPENDED");
        });
    });

    describe("unsuspend", () => {
        it("should unsuspend a suspended account", () => {
            const account = createAccount({ status: AccountStatus.SUSPENDED });
            account.unsuspend();

            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when account is not suspended", () => {
            const account = createAccount({ status: AccountStatus.ACTIVE });

            expect(() => account.unsuspend()).toThrow("NOT_SUSPENDED");
        });
    });

    describe("assignRelations", () => {
        it("should assign password and profile", () => {
            const account = createAccount();
            const identifier = {} as Identifier;
            const password = {} as Password;
            const profile = {} as Profile;

            account.assignRelations({ identifier, password, profile });

            expect(account.password).toBe(password);
            expect(account.profile).toBe(profile);
        });

        it("should assign profile without password", () => {
            const account = createAccount();
            const identifier = {} as Identifier;
            const profile = {} as Profile;

            account.assignRelations({ identifier, profile });

            expect(account.profile).toBe(profile);
            expect(account.password).toBeUndefined();
        });
    });
});
