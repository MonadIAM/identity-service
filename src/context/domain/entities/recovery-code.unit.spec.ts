import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RecoveryCode } from "./recovery-code.entity";
import { Account } from "./account.entity";

function createRecoveryCode(): RecoveryCode {
    return new RecoveryCode({
        account: {} as Account,
        hash: "recovery-hash",
    });
}

describe("[Entity] - RecoveryCode", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const code = new RecoveryCode({ account, hash: "my-hash" });

            // Assert
            expect(code.account).toBe(account);
            expect(code.hash).toBe("my-hash");
        });

        it("[case] - auto-generates id and createdAt", () => {
            // Arrange

            // Act
            const code = createRecoveryCode();
            const result = isUUID(code.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(code.createdAt).toBeInstanceOf(Date);
            expect(code.usedAt).toBeUndefined();
        });
    });

    describe("[Method] - use", () => {
        it("[case] - sets usedAt", () => {
            // Arrange
            const code = createRecoveryCode();

            // Act
            code.use();

            // Assert
            expect(code.usedAt).toBeInstanceOf(Date);
        });
    });
});
