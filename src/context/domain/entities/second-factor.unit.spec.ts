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

describe("[Entity] - SecondFactor", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;

            // Act
            const sf = createSecondFactor({ account, name: "Work Phone" });

            // Assert
            expect(sf.account).toBe(account);
            expect(sf.type).toBe(SecondFactorType.TOTP);
            expect(sf.secret).toBe("BASE32SECRET");
            expect(sf.name).toBe("Work Phone");
        });

        it("[case] - auto-generates id and createdAt", () => {
            // Arrange

            // Act
            const sf = createSecondFactor();
            const result = isUUID(sf.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(sf.createdAt).toBeInstanceOf(Date);
            expect(sf.confirmedAt).toBeUndefined();
        });
    });

    describe("[Method] - confirm", () => {
        it("[case] - sets confirmedAt", () => {
            // Arrange
            const sf = createSecondFactor();

            // Act
            sf.confirm();

            // Assert
            expect(sf.confirmedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already confirmed", () => {
            // Arrange
            const sf = createSecondFactor();

            // Act
            sf.confirm();
            const act = (): unknown => sf.confirm();

            // Assert
            expect(act).toThrow("CONFIRM_NOT_ALLOWED");
        });
    });
});
