import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { AccountMapper } from "./account.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

const helpers = new EntityFactoryRegistry();
const mapper = new AccountMapper();

describe("AccountMapper", () => {
    describe("notificationPayload", () => {
        it("maps an account verification notification", () => {
            expect(mapper.notificationPayload({ account: ACCOUNT_ID, otp: "123456" })).toEqual({
                input: {
                    template: MessageTemplate.ACCOUNT_VERIFICATION_OTP,
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    params: { otp: "123456" },
                    recipient: ACCOUNT_ID,
                    language: "en",
                },
            });
        });
    });

    describe("accountPayload", () => {
        it("maps the account identity", () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });

            expect(mapper.accountPayload({ account })).toEqual({ account: ACCOUNT_ID });
        });
    });
});
