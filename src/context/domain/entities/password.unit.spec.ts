import { describe, it, expect } from "@jest/globals";

import { Password } from "./password.entity";
import { Account } from "./account.entity";

function createPassword(hash = "initial-hash"): Password {
    return new Password({
        account: {} as Account,
        hash,
    });
}

describe("[Entity] - Password", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const password = new Password({ account, hash: "my-hash" });

            // Assert
            expect(password.account).toBe(account);
            expect(password.hash).toBe("my-hash");
            expect(password.setAt).toBeInstanceOf(Date);
            expect(password.version).toBe(1);
        });
    });

    describe("[Method] - rotate", () => {
        it("[case] - updates hash and increment version", () => {
            // Arrange
            const password = createPassword("old-hash");

            // Act
            password.rotate("new-hash");

            // Assert
            expect(password.hash).toBe("new-hash");
            expect(password.version).toBe(2);
        });

        it("[case] - returns previous hash and version", () => {
            // Arrange
            const password = createPassword("old-hash");

            // Act
            const previous = password.rotate("new-hash");

            // Assert
            expect(previous.hash).toBe("old-hash");
            expect(previous.version).toBe(1);
        });

        it("[case] - accumulates version across multiple rotations", () => {
            // Arrange
            const password = createPassword("v1");

            // Act
            password.rotate("v2");
            password.rotate("v3");

            // Assert
            expect(password.hash).toBe("v3");
            expect(password.version).toBe(3);
        });
    });
});
