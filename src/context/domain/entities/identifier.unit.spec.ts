import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { IdentifierType } from "~context/enums";

import { Identifier } from "./identifier.entity";
import { Account } from "./account.entity";

function createIdentifier(overrides?: Partial<Entities.Identifier.ConstructorProps>): Identifier {
    return new Identifier({
        type: IdentifierType.EMAIL,
        identity: "user@example.com",
        account: {} as Account,
        ...overrides,
    });
}

describe("[Entity] - Identifier", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const identifier = createIdentifier({ account, type: IdentifierType.PHONE, identity: "+79001234567" });

            // Assert
            expect(identifier.account).toBe(account);
            expect(identifier.type).toBe(IdentifierType.PHONE);
            expect(identifier.identity).toBe("+79001234567");
        });

        it("[case] - defaults flags to false", () => {
            // Arrange

            // Act
            const identifier = createIdentifier();

            // Assert
            expect(identifier.isVerified).toBe(false);
            expect(identifier.isPublicContact).toBe(false);
        });

        it("[case] - verifies when the constructor receives the verified flag", () => {
            // Arrange

            // Act
            const identifier = createIdentifier({ isVerified: true });

            // Assert
            expect(identifier.isVerified).toBe(true);
            expect(identifier.verifiedAt).toBeInstanceOf(Date);
        });

        it("[case] - auto-generates id and createdAt", () => {
            // Arrange

            // Act
            const identifier = createIdentifier();
            const result = isUUID(identifier.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(identifier.createdAt).toBeInstanceOf(Date);
            expect(identifier.verifiedAt).toBeUndefined();
            expect(identifier.lastUsedAt).toBeUndefined();
        });

        it("[case] - assigns optional provider fields when provided", () => {
            // Arrange

            // Act
            const identifier = createIdentifier({
                type: IdentifierType.OAUTH,
                provider: "google",
                providerUserId: "google-uid-123",
            });

            // Assert
            expect(identifier.provider).toBe("google");
            expect(identifier.providerUserId).toBe("google-uid-123");
        });

        it("[case] - leaves provider fields undefined when omitted", () => {
            // Arrange

            // Act
            const identifier = createIdentifier();

            // Assert
            expect(identifier.provider).toBeUndefined();
            expect(identifier.providerUserId).toBeUndefined();
        });
    });

    describe("[Method] - verify", () => {
        it("[case] - verifies an unverified identifier", () => {
            // Arrange
            const identifier = createIdentifier();

            // Act
            identifier.verify();

            // Assert
            expect(identifier.isVerified).toBe(true);
            expect(identifier.verifiedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already verified", () => {
            // Arrange
            const identifier = createIdentifier();

            // Act
            identifier.verify();
            const act = (): unknown => identifier.verify();

            // Assert
            expect(act).toThrow("ALREADY_VERIFIED");
        });
    });

    describe("[Method] - togglePublicContact", () => {
        it("[case] - throws for oauth identifier", () => {
            // Arrange
            const identifier = createIdentifier({ type: IdentifierType.OAUTH });

            // Act
            const act = (): unknown => identifier.togglePublicContact();

            // Assert
            expect(act).toThrow("PUBLIC_CONTACT_NOT_APPLICABLE");
        });

        it("[case] - throws when identifier is not verified", () => {
            // Arrange
            const identifier = createIdentifier({ type: IdentifierType.EMAIL });

            // Act
            const act = (): unknown => identifier.togglePublicContact();

            // Assert
            expect(act).toThrow("PUBLIC_CONTACT_REQUIRES_VERIFICATION");
        });

        it("[case] - toggles when identifier is verified and not oauth", () => {
            // Arrange
            const identifier = createIdentifier({ type: IdentifierType.EMAIL });
            identifier.verify();
            const before = identifier.isPublicContact;

            // Act
            identifier.togglePublicContact();

            // Assert
            expect(identifier.isPublicContact).toBe(!before);
        });
    });
});
