import { describe, it, expect } from "@jest/globals";

import { MasterCode } from "./master-code.entity";
import { Account } from "./account.entity";

describe("[Entity] - MasterCode", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const masterCode = new MasterCode({ account, hash: "hashed-master-code" });

            // Assert
            expect(masterCode.account).toBe(account);
            expect(masterCode.hash).toBe("hashed-master-code");
            expect(masterCode.createdAt).toBeInstanceOf(Date);
        });
    });
});
