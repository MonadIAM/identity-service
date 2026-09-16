import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

import { PasswordMapper } from "./password.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-800000000001";

const mapper = new PasswordMapper();

function expected(
    template: MessageTemplate,
    params?: Record<string, string>,
): Topics.Notification.CreateMessage["payload"] {
    return {
        input: {
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: ACCOUNT_ID,
            language: "en",
            template,
            ...(params ? { params } : {}),
        },
    };
}

describe("PasswordMapper", () => {
    describe("passwordChangedPayload", () => {
        it("maps a password changed notification", () => {
            expect(mapper.passwordChangedPayload({ account: ACCOUNT_ID, message: "commands.password.CHANGED" })).toEqual(
                expected(MessageTemplate.PASSWORD_CHANGED),
            );
        });
    });

    describe("passwordChangedViaOtpPayload", () => {
        it("maps an OTP password change notification", () => {
            expect(
                mapper.passwordChangedViaOtpPayload({ account: ACCOUNT_ID, message: "commands.password.CHANGED" }),
            ).toEqual(expected(MessageTemplate.PASSWORD_CHANGED_VIA_OTP));
        });
    });

    describe("passwordChangedViaRecoveryCodePayload", () => {
        it("maps a recovery-code password change notification", () => {
            expect(
                mapper.passwordChangedViaRecoveryCodePayload({
                    account: ACCOUNT_ID,
                    message: "commands.password.CHANGED",
                }),
            ).toEqual(expected(MessageTemplate.PASSWORD_CHANGED_VIA_RECOVERY_CODE));
        });
    });

    describe("notificationPayload", () => {
        it("maps a reset password OTP notification", () => {
            expect(mapper.notificationPayload({ account: ACCOUNT_ID, otp: "123456" })).toEqual(
                expected(MessageTemplate.RESET_PASSWORD_OTP, { otp: "123456" }),
            );
        });
    });
});
