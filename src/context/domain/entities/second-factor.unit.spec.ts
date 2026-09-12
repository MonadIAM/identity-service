import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { SecondFactorType } from "~context/enums";

import { SecondFactor } from "./second-factor.entity";
import { Account } from "./account.entity";

function createSecondFactor(overrides?: Partial<Entities.SecondFactor.ConstructorProps>): SecondFactor {
    return new SecondFactor({
        type: SecondFactorType.TOTP,
        name: "My Authenticator",
        secret: "BASE32SECRET",
        account: {} as Account,
        ...overrides,
    });
}

describe("SecondFactor Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;

            const sf = createSecondFactor({ account, name: "Work Phone" });

            expect(sf.account).toBe(account);
            expect(sf.type).toBe(SecondFactorType.TOTP);
            expect(sf.secret).toBe("BASE32SECRET");
            expect(sf.name).toBe("Work Phone");
        });

        it("should auto-generate id and createdAt", () => {
            const sf = createSecondFactor();

            expect(isUUID(sf.id, "4")).toBe(true);
            expect(sf.createdAt).toBeInstanceOf(Date);
            expect(sf.confirmedAt).toBeUndefined();
        });
    });

    describe("confirm", () => {
        it("should set confirmedAt", () => {
            const sf = createSecondFactor();
            sf.confirm();

            expect(sf.confirmedAt).toBeInstanceOf(Date);
        });

        it("should throw when already confirmed", () => {
            const sf = createSecondFactor();
            sf.confirm();

            expect(() => sf.confirm()).toThrow("CONFIRM_NOT_ALLOWED");
        });
    });
});
