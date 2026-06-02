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

describe("RecoveryCode Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const code = new RecoveryCode({ account, hash: "my-hash" });

            expect(code.account).toBe(account);
            expect(code.hash).toBe("my-hash");
        });

        it("should auto-generate id and createdAt", () => {
            const code = createRecoveryCode();

            expect(isUUID(code.id, "4")).toBe(true);
            expect(code.createdAt).toBeInstanceOf(Date);
            expect(code.usedAt).toBeUndefined();
        });
    });

    describe("use", () => {
        it("should set usedAt", () => {
            const code = createRecoveryCode();
            code.use();

            expect(code.usedAt).toBeInstanceOf(Date);
        });
    });
});
