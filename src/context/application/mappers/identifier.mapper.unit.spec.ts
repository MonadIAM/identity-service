import { describe, expect, it } from "@jest/globals";

import { EntityFactoryRegistry } from "~testing/entity-factory.registry";
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
const helpers = new EntityFactoryRegistry();

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

    describe("[Behavior] - email synchronization", () => {
        it.each([
            { type: IdentifierType.EMAIL, isVerified: true, count: 1 },
            { type: IdentifierType.EMAIL, isVerified: false, count: 0 },
            { type: IdentifierType.PHONE, isVerified: true, count: 0 },
        ])("[case] - emits confirmed email facts only: %j", ({ type, isVerified, count }) => {
            // Arrange
            const identifier = helpers.createIdentifier({ type, isVerified });

            // Act
            const result = mapper.emailPayload({ identifier });

            // Assert
            expect(result).toHaveLength(count);
            if (count) {
                expect(result[0]).toEqual({
                    account: identifier.account.id,
                    identifier: { id: identifier.id, type: IdentifierType.EMAIL, value: identifier.identity },
                });
            }
        });

        it("[case] - includes the replacement selected in the deletion transaction", () => {
            // Arrange
            const identifier = helpers.createIdentifier({ type: IdentifierType.EMAIL, isVerified: true });
            const replacement = helpers.createIdentifier({ type: IdentifierType.EMAIL, isVerified: true });

            // Act
            const result = mapper.emailPurgedPayload({ identifier, replacement });

            // Assert
            expect(result[0].replacement).toEqual({
                id: replacement.id,
                type: IdentifierType.EMAIL,
                value: replacement.identity,
            });
        });
    });
});
