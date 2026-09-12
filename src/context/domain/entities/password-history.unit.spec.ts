import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { PasswordHistory } from "./password-history.entity";
import { Account } from "./account.entity";

describe("PasswordHistory Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const entry = new PasswordHistory({ account, version: 2, hash: "old-hash" });

            expect(entry.account).toBe(account);
            expect(entry.version).toBe(2);
            expect(entry.hash).toBe("old-hash");
        });

        it("should auto-generate id and setAt", () => {
            const entry = new PasswordHistory({
                account: {} as Account,
                version: 1,
                hash: "hash",
            });

            expect(isUUID(entry.id, "4")).toBe(true);
            expect(entry.setAt).toBeInstanceOf(Date);
        });
    });
});
