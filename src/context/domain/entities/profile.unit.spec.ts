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

describe("[Entity] - Profile", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const profile = createProfile({ account, displayName: "Jane Doe" });

            // Assert
            expect(profile.account).toBe(account);
            expect(profile.displayName).toBe("Jane Doe");
        });

        it("[case] - assigns optional fields when provided", () => {
            // Arrange

            // Act
            const profile = createProfile({
                pictureUrl: "https://example.com/avatar.png",
                timeZone: "Europe/Moscow",
                locale: "ru",
            });

            // Assert
            expect(profile.pictureUrl).toBe("https://example.com/avatar.png");
            expect(profile.timeZone).toBe("Europe/Moscow");
            expect(profile.locale).toBe("ru");
        });

        it("[case] - leaves optional fields undefined when omitted", () => {
            // Arrange

            // Act
            const profile = createProfile();

            // Assert
            expect(profile.pictureUrl).toBeUndefined();
            expect(profile.timeZone).toBeUndefined();
            expect(profile.locale).toBeUndefined();
            expect(profile.updatedAt).toBeUndefined();
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const profile = createProfile({ displayName: "Old Name" });

            // Act
            profile.update({ displayName: "New Name" });

            // Assert
            expect(profile.displayName).toBe("New Name");
            expect(profile.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const profile = createProfile({ displayName: "Old", locale: "en" });

            // Act
            profile.update({ displayName: "New", locale: "ru" });

            // Assert
            expect(profile.displayName).toBe("New");
            expect(profile.locale).toBe("ru");
        });

        it("[case] - skips unchanged fields", () => {
            // Arrange
            const profile = createProfile({ displayName: "Same", locale: "en" });

            // Act
            profile.update({ displayName: "Same", locale: "ru" });

            // Assert
            expect(profile.displayName).toBe("Same");
            expect(profile.locale).toBe("ru");
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const profile = createProfile({ displayName: "Original" });

            // Act
            profile.update({ displayName: "Updated", pictureUrl: undefined });

            // Assert
            expect(profile.displayName).toBe("Updated");
            expect(profile.pictureUrl).toBeUndefined();
        });

        it("[case] - throws when patch is empty object", () => {
            // Arrange
            const profile = createProfile();

            // Act
            const act = (): unknown => profile.update({});

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws when no values actually changed", () => {
            // Arrange
            const profile = createProfile({ displayName: "Same" });

            // Act
            const act = (): unknown => profile.update({ displayName: "Same" });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });
    });
});
