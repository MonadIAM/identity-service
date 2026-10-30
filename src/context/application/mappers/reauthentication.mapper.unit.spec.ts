import { describe, expect, it } from "@jest/globals";

import {
    NotificationContentKind,
    ReauthenticationMethod,
    NotificationCategory,
    MessageTemplate,
    PlatformService,
    ChannelType,
} from "~context/enums";

import { ReauthenticationMapper } from "./reauthentication.mapper";

const mapper = new ReauthenticationMapper();

describe("[DataMapper] - Reauthentication", () => {
    describe("[Method] - notificationPayload", () => {
        it("[case] - targets the verified email explicitly with the reauthentication OTP template", () => {
            // Arrange
            const props = {
                account: "account-id",
                address: "verified@example.test",
                otp: "123456",
            };

            // Act
            const result = mapper.notificationPayload(props);

            // Assert
            expect(result).toEqual({
                input: {
                    delivery: { channelType: ChannelType.EMAIL, address: "verified@example.test" },
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    template: MessageTemplate.REAUTHENTICATION_OTP,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    recipient: "account-id",
                    params: { otp: "123456" },
                },
            });
        });
    });

    describe("[Method] - grantPayload", () => {
        it.each<Topics.Reauthentication.Proof>([
            { method: ReauthenticationMethod.PASSWORD },
            { method: ReauthenticationMethod.OTP },
            { method: ReauthenticationMethod.TOTP, factor: "00000000-0000-4000-8000-900000000002" },
        ])("[case] - preserves the verified proof in the event payload ($method)", (proof) => {
            // Arrange
            const props = {
                session: "00000000-0000-4000-8000-900000000001",
                expiresAt: 1_789_000_000_000,
                proof,
            };

            // Act
            const result = mapper.grantPayload(props);

            // Assert
            expect(result).toEqual(props);
        });

        it("[case] - maps the session and expiration timestamp", () => {
            // Arrange

            // Act
            const result = mapper.grantPayload({
                session: "00000000-0000-4000-8000-900000000001",
                expiresAt: 1_789_000_000_000,
            });

            // Assert
            expect(result).toEqual({
                session: "00000000-0000-4000-8000-900000000001",
                expiresAt: 1_789_000_000_000,
            });
        });
    });
});
