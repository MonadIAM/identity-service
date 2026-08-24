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

describe("Identifier Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const identifier = createIdentifier({ account, type: IdentifierType.PHONE, identity: "+79001234567" });

            expect(identifier.account).toBe(account);
            expect(identifier.type).toBe(IdentifierType.PHONE);
            expect(identifier.identity).toBe("+79001234567");
        });

        it("should default flags to false", () => {
            const identifier = createIdentifier();

            expect(identifier.isVerified).toBe(false);
            expect(identifier.isPublicContact).toBe(false);
        });

        it("should auto-generate id and createdAt", () => {
            const identifier = createIdentifier();

            expect(isUUID(identifier.id, "4")).toBe(true);
            expect(identifier.createdAt).toBeInstanceOf(Date);
            expect(identifier.verifiedAt).toBeUndefined();
            expect(identifier.lastUsedAt).toBeUndefined();
        });

        it("should assign optional provider fields when provided", () => {
            const identifier = createIdentifier({
                type: IdentifierType.OAUTH,
                provider: "google",
                providerUserId: "google-uid-123",
            });

            expect(identifier.provider).toBe("google");
            expect(identifier.providerUserId).toBe("google-uid-123");
        });

        it("should leave provider fields undefined when omitted", () => {
            const identifier = createIdentifier();

            expect(identifier.provider).toBeUndefined();
            expect(identifier.providerUserId).toBeUndefined();
        });
    });

    describe("verify", () => {
        it("should verify an unverified identifier", () => {
            const identifier = createIdentifier();
            identifier.verify();

            expect(identifier.isVerified).toBe(true);
            expect(identifier.verifiedAt).toBeInstanceOf(Date);
        });

        it("should throw when already verified", () => {
            const identifier = createIdentifier();
            identifier.verify();

            expect(() => identifier.verify()).toThrow("ALREADY_VERIFIED");
        });
    });

    describe("togglePublicContact", () => {
        it("should throw for oauth identifier", () => {
            const identifier = createIdentifier({ type: IdentifierType.OAUTH });

            expect(() => identifier.togglePublicContact()).toThrow("PUBLIC_CONTACT_NOT_APPLICABLE");
        });

        it("should throw when identifier is not verified", () => {
            const identifier = createIdentifier({ type: IdentifierType.EMAIL });

            expect(() => identifier.togglePublicContact()).toThrow("PUBLIC_CONTACT_REQUIRES_VERIFICATION");
        });

        it("should toggle when identifier is verified and not oauth", () => {
            const identifier = createIdentifier({ type: IdentifierType.EMAIL });
            identifier.verify();

            const before = identifier.isPublicContact;
            identifier.togglePublicContact();

            expect(identifier.isPublicContact).toBe(!before);
        });
    });
});
