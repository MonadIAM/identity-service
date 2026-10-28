import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
import { IdentifierType } from "~context/enums";

import { AccountMapper } from "./account.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

const helpers = new EntityFactoryRegistry();
const mapper = new AccountMapper();

describe("[DataMapper] - Account", () => {
    describe("[Method] - registrationPayload", () => {
        it("[case] - maps the registration event with its contact and OTP", () => {
            // Arrange

            // Act
            const result = mapper.registrationPayload({
                account: ACCOUNT_ID,
                otp: "123456",
                identifier: helpers.createIdentifier({
                    id: ACCOUNT_ID,
                    identity: "user@example.test",
                    type: IdentifierType.EMAIL,
                }),
            });

            // Assert
            expect(result).toEqual({
                account: ACCOUNT_ID,
                otp: "123456",
                identifier: { id: ACCOUNT_ID, type: IdentifierType.EMAIL, value: "user@example.test" },
            });
        });
    });

    describe("[Method] - accountPayload", () => {
        it("[case] - maps the account identity", () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });

            // Act
            const result = mapper.accountPayload({ account });

            // Assert
            expect(result).toEqual({ account: ACCOUNT_ID, locale: "en", timezone: "UTC" });
        });

        it("[case] - includes the verified contact in the account confirmation event", () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const identifier = helpers.createIdentifier({
                account,
                isVerified: true,
                type: IdentifierType.PHONE,
                identity: "+79990000000",
            });
            account.identifiers = helpers.collection({ owner: account, items: [identifier] });

            // Act
            const result = mapper.accountPayload({ account });

            // Assert
            expect(result).toEqual({
                identifier: { id: identifier.id, type: IdentifierType.PHONE, value: identifier.identity },
                account: ACCOUNT_ID,
                timezone: "UTC",
                locale: "en",
            });
        });
    });
});
