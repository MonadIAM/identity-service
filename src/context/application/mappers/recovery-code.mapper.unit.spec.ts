import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";

import { RecoveryCodeMapper } from "./recovery-code.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-a00000000001";

const mapper = new RecoveryCodeMapper();

describe("[DataMapper] - RecoveryCode", () => {
    describe("[Method] - notificationPayload", () => {
        it("[case] - maps a recovery-code regeneration notification", () => {
            // Arrange

            // Act
            const result = mapper.notificationPayload({ account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual({
                input: {
                    template: MessageTemplate.RECOVERY_CODES_REGENERATED,
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    recipient: ACCOUNT_ID,
                },
            });
        });
    });
});
