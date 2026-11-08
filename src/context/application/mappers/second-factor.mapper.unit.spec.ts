import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { SecondFactorMapper } from "./second-factor.mapper";

const ACCOUNT_ID = "00000000-0000-4000-8000-b00000000001";

const mapper = new SecondFactorMapper();
const helpers = new EntityFactoryRegistry();

function expected(
    template:
        MessageTemplate.SECOND_FACTOR_PURGED | MessageTemplate.SECOND_FACTOR_ENABLED | MessageTemplate.SECOND_FACTOR_RESET,
): Topics.Notification.CreateMessage["payload"] {
    return {
        input: {
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: ACCOUNT_ID,
            template,
        },
    };
}

describe("[DataMapper] - SecondFactor", () => {
    describe("[Method] - secondFactorPurgedPayload", () => {
        it("[case] - maps a confirmed factor purge notification", () => {
            // Arrange
            const factor = helpers.createSecondFactor({ confirmedAt: new Date() });

            // Act
            const result = mapper.secondFactorPurgedPayload({ factor, account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual([expected(MessageTemplate.SECOND_FACTOR_PURGED)]);
        });

        it("[case] - does not notify when an unconfirmed factor is purged", () => {
            // Arrange
            const factor = helpers.createSecondFactor();

            // Act
            const result = mapper.secondFactorPurgedPayload({ factor, account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual([]);
        });

        it("[case] - does not notify when no factor was removed", () => {
            // Arrange

            // Act
            const result = mapper.secondFactorPurgedPayload({ factor: undefined, account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe("[Method] - secondFactorEnabledPayload", () => {
        it("[case] - maps a second-factor enabled notification", () => {
            // Arrange

            // Act
            const result = mapper.secondFactorEnabledPayload({ account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual(expected(MessageTemplate.SECOND_FACTOR_ENABLED));
        });
    });

    describe("[Method] - secondFactorResetPayload", () => {
        it("[case] - maps a second-factor reset notification", () => {
            // Arrange

            // Act
            const result = mapper.secondFactorResetPayload({ account: ACCOUNT_ID });

            // Assert
            expect(result).toEqual(expected(MessageTemplate.SECOND_FACTOR_RESET));
        });
    });
});
