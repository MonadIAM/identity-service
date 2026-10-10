import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { PasswordHistory } from "./password-history.entity";
import { Account } from "./account.entity";

describe("[Entity] - PasswordHistory", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const entry = new PasswordHistory({ account, version: 2, hash: "old-hash" });

            // Assert
            expect(entry.account).toBe(account);
            expect(entry.version).toBe(2);
            expect(entry.hash).toBe("old-hash");
        });

        it("[case] - auto-generates id and setAt", () => {
            // Arrange

            // Act
            const entry = new PasswordHistory({
                account: {} as Account,
                version: 1,
                hash: "hash",
            });
            const result = isUUID(entry.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(entry.setAt).toBeInstanceOf(Date);
        });
    });
});
