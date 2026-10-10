import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

import { AuthnMapper } from "./authn.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-200000000001";

const mapper = new AuthnMapper();

describe("[DataMapper] - Authn", () => {
    describe("[Method] - notificationPayload", () => {
        it("[case] - maps a login OTP notification", () => {
            // Arrange

            // Act
            const result = mapper.notificationPayload({ account: ACCOUNT_ID, otp: "654321" });

            // Assert
            expect(result).toEqual({
                input: {
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    template: MessageTemplate.LOGIN_OTP,
                    params: { otp: "654321" },
                    recipient: ACCOUNT_ID,
                    language: "en",
                },
            });
        });
    });
});
