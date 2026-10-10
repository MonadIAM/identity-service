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

describe("[DataMapper] - Password", () => {
    describe("[Method] - passwordChangedPayload", () => {
        it("[case] - maps a password changed notification", () => {
            // Arrange

            // Act
            const result = mapper.passwordChangedPayload({ account: ACCOUNT_ID, message: "commands.password.CHANGED" });

            // Assert
            expect(result).toEqual(expected(MessageTemplate.PASSWORD_CHANGED));
        });
    });

    describe("[Method] - passwordChangedViaOtpPayload", () => {
        it("[case] - maps an OTP password change notification", () => {
            // Arrange

            // Act
            const result = mapper.passwordChangedViaOtpPayload({
                account: ACCOUNT_ID,
                message: "commands.password.CHANGED",
            });

            // Assert
            expect(result).toEqual(expected(MessageTemplate.PASSWORD_CHANGED_VIA_OTP));
        });
    });

    describe("[Method] - passwordChangedViaRecoveryCodePayload", () => {
        it("[case] - maps a recovery-code password change notification", () => {
            // Arrange

            // Act
            const result = mapper.passwordChangedViaRecoveryCodePayload({
                account: ACCOUNT_ID,
                message: "commands.password.CHANGED",
            });

            // Assert
            expect(result).toEqual(expected(MessageTemplate.PASSWORD_CHANGED_VIA_RECOVERY_CODE));
        });
    });

    describe("[Method] - notificationPayload", () => {
        it("[case] - maps a reset password OTP notification", () => {
            // Arrange

            // Act
            const result = mapper.notificationPayload({ account: ACCOUNT_ID, otp: "123456" });

            // Assert
            expect(result).toEqual(expected(MessageTemplate.RESET_PASSWORD_OTP, { otp: "123456" }));
        });
    });
});
