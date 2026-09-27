import { describe, expect, it } from "@jest/globals";

import { IdentifierType } from "~context/enums";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { AccountMapper } from "./account.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

const helpers = new EntityFactoryRegistry();
const mapper = new AccountMapper();

describe("AccountMapper", () => {
    describe("registrationPayload", () => {
        it("maps the registration event with its contact and OTP", () => {
            expect(
                mapper.registrationPayload({
                    account: ACCOUNT_ID,
                    otp: "123456",
                    identifier: helpers.createIdentifier({
                        id: ACCOUNT_ID,
                        identity: "user@example.test",
                        type: IdentifierType.EMAIL,
                    }),
                }),
            ).toEqual({
                account: ACCOUNT_ID,
                otp: "123456",
                identifier: { id: ACCOUNT_ID, type: IdentifierType.EMAIL, value: "user@example.test" },
            });
        });
    });

    describe("accountPayload", () => {
        it("maps the account identity", () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });

            expect(mapper.accountPayload({ account })).toEqual({ account: ACCOUNT_ID });
        });

        it("includes the verified contact in the account confirmation event", () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const identifier = helpers.createIdentifier({
                account,
                isVerified: true,
                type: IdentifierType.PHONE,
                identity: "+79990000000",
            });
            account.identifiers = helpers.collection({ owner: account, items: [identifier] });

            expect(mapper.accountPayload({ account })).toEqual({
                account: ACCOUNT_ID,
                identifier: { id: identifier.id, type: IdentifierType.PHONE, value: identifier.identity },
            });
        });
    });
});
