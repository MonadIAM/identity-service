import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

import { SecondFactorMapper } from "./second-factor.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-b00000000001";

const mapper = new SecondFactorMapper();

function expected(template: MessageTemplate): Topics.Notification.CreateMessage["payload"] {
    return {
        input: {
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: ACCOUNT_ID,
            language: "en",
            template,
        },
    };
}

describe("SecondFactorMapper", () => {
    describe("secondFactorEnabledPayload", () => {
        it("maps a second-factor enabled notification", () => {
            expect(mapper.secondFactorEnabledPayload({ account: ACCOUNT_ID })).toEqual(
                expected(MessageTemplate.SECOND_FACTOR_ENABLED),
            );
        });
    });

    describe("secondFactorResetPayload", () => {
        it("maps a second-factor reset notification", () => {
            expect(mapper.secondFactorResetPayload({ account: ACCOUNT_ID })).toEqual(
                expected(MessageTemplate.SECOND_FACTOR_RESET),
            );
        });
    });
});
