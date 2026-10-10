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

describe("[Entity] - Account", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const account = createAccount({
                subject: AccountSubject.SERVICE,
                status: AccountStatus.ACTIVE,
            });

            // Assert
            expect(account.subject).toBe(AccountSubject.SERVICE);
            expect(account.status).toBe(AccountStatus.ACTIVE);
        });

        it("[case] - defaults is2FAEnforced to false", () => {
            // Arrange

            // Act
            const account = createAccount();

            // Assert
            expect(account.is2FAEnforced).toBe(false);
        });

        it("[case] - auto-generates id, createdAt, version", () => {
            // Arrange

            // Act
            const account = createAccount();
            const result = isUUID(account.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(account.createdAt).toBeInstanceOf(Date);
            expect(account.version).toBe(1);
            expect(account.updatedAt).toBeUndefined();
            expect(account.lastActiveAt).toBeUndefined();
        });
    });

    describe("[Method] - touch", () => {
        it("[case] - sets lastActiveAt", () => {
            // Arrange
            const account = createAccount();

            // Act
            account.touch();

            // Assert
            expect(account.lastActiveAt).toBeInstanceOf(Date);
        });
    });

    describe("[Method] - activate", () => {
        it("[case] - activates a pending account", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.PENDING });

            // Act
            account.activate();

            // Assert
            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when account is not pending", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.ACTIVE });

            // Act
            const act = (): unknown => account.activate();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVATED");
        });
    });

    describe("[Method] - deactivate", () => {
        it("[case] - deactivates an active account", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.ACTIVE });

            // Act
            account.deactivate();

            // Assert
            expect(account.status).toBe(AccountStatus.DEACTIVATED);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when account is not active", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.PENDING });

            // Act
            const act = (): unknown => account.deactivate();

            // Assert
            expect(act).toThrow("DEACTIVATION_NOT_ALLOWED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a deactivated account", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.DEACTIVATED });

            // Act
            account.restore();

            // Assert
            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when account is not deactivated", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.ACTIVE });

            // Act
            const act = (): unknown => account.restore();

            // Assert
            expect(act).toThrow("RESTORE_NOT_ALLOWED");
        });
    });

    describe("[Method] - suspend", () => {
        it("[case] - suspends an active account", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.ACTIVE });

            // Act
            account.suspend();

            // Assert
            expect(account.status).toBe(AccountStatus.SUSPENDED);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when account is already suspended", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.SUSPENDED });

            // Act
            const act = (): unknown => account.suspend();

            // Assert
            expect(act).toThrow("ALREADY_SUSPENDED");
        });
    });

    describe("[Method] - unsuspend", () => {
        it("[case] - unsuspends a suspended account", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.SUSPENDED });

            // Act
            account.unsuspend();

            // Assert
            expect(account.status).toBe(AccountStatus.ACTIVE);
            expect(account.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when account is not suspended", () => {
            // Arrange
            const account = createAccount({ status: AccountStatus.ACTIVE });

            // Act
            const act = (): unknown => account.unsuspend();

            // Assert
            expect(act).toThrow("NOT_SUSPENDED");
        });
    });

    describe("[Method] - assignRelations", () => {
        it("[case] - assigns password and profile", () => {
            // Arrange
            const account = createAccount();
            const identifier = {} as Identifier;
            const password = {} as Password;
            const profile = {} as Profile;

            // Act
            account.assignRelations({ identifier, password, profile });

            // Assert
            expect(account.password).toBe(password);
            expect(account.profile).toBe(profile);
        });

        it("[case] - assigns profile without password", () => {
            // Arrange
            const account = createAccount();
            const identifier = {} as Identifier;
            const profile = {} as Profile;

            // Act
            account.assignRelations({ identifier, profile });

            // Assert
            expect(account.profile).toBe(profile);
            expect(account.password).toBeUndefined();
        });
    });
});
