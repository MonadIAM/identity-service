import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

import { IdentifierMapper } from "./identifier.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-400000000001";

const mapper = new IdentifierMapper();

describe("IdentifierMapper", () => {
    describe("identifierPurgedPayload", () => {
        it("maps an identifier purge notification", () => {
            expect(mapper.identifierPurgedPayload({ account: ACCOUNT_ID })).toEqual({
                input: {
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    template: MessageTemplate.IDENTIFIER_PURGED,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    recipient: ACCOUNT_ID,
                    language: "en",
                },
            });
        });
    });

    describe("notificationPayload", () => {
        it("maps an identifier verification notification", () => {
            expect(
                mapper.notificationPayload({ account: ACCOUNT_ID, identifier: "user@example.com", otp: "123456" }),
            ).toEqual({
                input: {
                    template: MessageTemplate.IDENTIFIER_VERIFICATION_OTP,
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
});
