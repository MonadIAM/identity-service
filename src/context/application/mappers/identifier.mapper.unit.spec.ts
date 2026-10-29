import { describe, expect, it } from "@jest/globals";

import {
    NotificationContentKind,
    NotificationCategory,
    PlatformService,
    MessageTemplate,
    IdentifierType,
    ChannelType,
} from "~context/enums";

import { IdentifierMapper } from "./identifier.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-400000000001";

const mapper = new IdentifierMapper();

describe("[DataMapper] - Identifier", () => {
    describe("[Method] - identifierPurgedPayload", () => {
        it("[case] - maps an identifier purge notification", () => {
            // Arrange

            // Act
            const result = mapper.identifierPurgedPayload({ account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual({
                input: {
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    template: MessageTemplate.IDENTIFIER_PURGED,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    recipient: ACCOUNT_ID,
                },
            });
        });
    });

    describe("[Method] - notificationPayload", () => {
        it("[case] - maps an identifier verification notification", () => {
            // Arrange

            // Act
            const result = mapper.notificationPayload({
                account: ACCOUNT_ID,
                identifier: { id: "identifier-id", identity: "user@example.com", type: IdentifierType.EMAIL },
                otp: "123456",
            });

            // Assert
            expect(result).toEqual({
                input: {
                    template: MessageTemplate.IDENTIFIER_VERIFICATION_OTP,
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    params: { otp: "123456" },
                    delivery: { channelType: ChannelType.EMAIL, address: "user@example.com" },
                    recipient: ACCOUNT_ID,
                },
            });
        });
    });
});
