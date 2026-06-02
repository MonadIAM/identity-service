import { describe, it, expect } from "@jest/globals";

import { Account } from "./account.entity";
import { Password } from "./password.entity";

function createPassword(hash = "initial-hash"): Password {
    return new Password({
        account: {} as Account,
        hash,
    });
}

describe("Password Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const password = new Password({ account, hash: "my-hash" });

            expect(password.account).toBe(account);
            expect(password.hash).toBe("my-hash");
            expect(password.setAt).toBeInstanceOf(Date);
            expect(password.version).toBe(1);
        });
    });

    describe("rotate", () => {
        it("should update hash and increment version", () => {
            const password = createPassword("old-hash");

            password.rotate("new-hash");

            expect(password.hash).toBe("new-hash");
            expect(password.version).toBe(2);
        });

        it("should return previous hash and version", () => {
            const password = createPassword("old-hash");

            const previous = password.rotate("new-hash");

            expect(previous.hash).toBe("old-hash");
            expect(previous.version).toBe(1);
        });

        it("should accumulate version across multiple rotations", () => {
            const password = createPassword("v1");

            password.rotate("v2");
            password.rotate("v3");

            expect(password.hash).toBe("v3");
            expect(password.version).toBe(3);
        });
    });
});
