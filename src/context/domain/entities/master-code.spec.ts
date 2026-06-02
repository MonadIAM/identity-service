import { describe, it, expect } from "@jest/globals";

import { MasterCode } from "./master-code.entity";
import { Account } from "./account.entity";

describe("MasterCode Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const masterCode = new MasterCode({ account, hash: "hashed-master-code" });

            expect(masterCode.account).toBe(account);
            expect(masterCode.hash).toBe("hashed-master-code");
            expect(masterCode.createdAt).toBeInstanceOf(Date);
        });
    });
});
