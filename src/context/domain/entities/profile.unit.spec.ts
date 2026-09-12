import { describe, it, expect } from "@jest/globals";

import { Account } from "./account.entity";
import { Profile } from "./profile.entity";

function createProfile(overrides?: Partial<Entities.Profile.ConstructorProps>): Profile {
    return new Profile({
        displayName: "John Doe",
        account: {} as Account,
        ...overrides,
    });
}

describe("Profile Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const profile = createProfile({ account, displayName: "Jane Doe" });

            expect(profile.account).toBe(account);
            expect(profile.displayName).toBe("Jane Doe");
        });

        it("should assign optional fields when provided", () => {
            const profile = createProfile({
                pictureUrl: "https://example.com/avatar.png",
                timeZone: "Europe/Moscow",
                locale: "ru",
            });

            expect(profile.pictureUrl).toBe("https://example.com/avatar.png");
            expect(profile.timeZone).toBe("Europe/Moscow");
            expect(profile.locale).toBe("ru");
        });

        it("should leave optional fields undefined when omitted", () => {
            const profile = createProfile();

            expect(profile.pictureUrl).toBeUndefined();
            expect(profile.timeZone).toBeUndefined();
            expect(profile.locale).toBeUndefined();
            expect(profile.updatedAt).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const profile = createProfile({ displayName: "Old Name" });

            profile.update({ displayName: "New Name" });

            expect(profile.displayName).toBe("New Name");
            expect(profile.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const profile = createProfile({ displayName: "Old", locale: "en" });

            profile.update({ displayName: "New", locale: "ru" });

            expect(profile.displayName).toBe("New");
            expect(profile.locale).toBe("ru");
        });

        it("should skip unchanged fields", () => {
            const profile = createProfile({ displayName: "Same", locale: "en" });

            profile.update({ displayName: "Same", locale: "ru" });

            expect(profile.displayName).toBe("Same");
            expect(profile.locale).toBe("ru");
        });

        it("should ignore undefined values in patch", () => {
            const profile = createProfile({ displayName: "Original" });

            profile.update({ displayName: "Updated", pictureUrl: undefined });

            expect(profile.displayName).toBe("Updated");
            expect(profile.pictureUrl).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const profile = createProfile();

            expect(() => profile.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const profile = createProfile({ displayName: "Same" });

            expect(() => profile.update({ displayName: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });
    });
});
