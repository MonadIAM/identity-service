import { describe, expect, it } from "@jest/globals";

import { NotificationContentKind, NotificationCategory, PlatformService, MessageTemplate } from "~context/enums";
import { EntityFactoryRegistry } from "~testing/entity-factory.registry";

import { SessionMapper } from "./session.mapper";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID        = "00000000-0000-4000-8000-d00000000001";
const SESSION_ID        = "00000000-0000-4000-8000-d00000000002";
const SECOND_SESSION_ID = "00000000-0000-4000-8000-d00000000003";
/* eslint-enable prettier/prettier */

const mapper = new SessionMapper(3_600);
const helpers = new EntityFactoryRegistry();

function createSessions(): Entities.Session[] {
    return [
        helpers.createSession({ id: SESSION_ID, lastRefreshedAt: new Date("2026-09-15T10:00:00.000Z") }),
        helpers.createSession({ id: SECOND_SESSION_ID, lastRefreshedAt: new Date("2026-09-15T11:00:00.000Z") }),
    ];
}

describe("[DataMapper] - Session", () => {
    describe("[Method] - notificationPayload", () => {
        it("[case] - maps a login alert notification", () => {
            // Arrange

            // Act
            const result = mapper.notificationPayload({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                revokedSessions: [],
                account: ACCOUNT_ID,
            });

            // Assert
            expect(result).toEqual({
                input: {
                    sourceService: PlatformService.IDENTITY_SERVICE,
                    category: NotificationCategory.SECURITY,
                    kind: NotificationContentKind.TEMPLATE,
                    template: MessageTemplate.LOGIN_ALERT,
                    recipient: ACCOUNT_ID,
                    language: "en",
                },
            });
        });
    });

    describe("[Method] - blacklistPayload", () => {
        it("[case] - returns precomputed revoked sessions unchanged", () => {
            // Arrange
            const revokedSessions = [{ session: SESSION_ID, expiresAt: 1_789_000_000_000 }];

            // Act
            const result = mapper.blacklistPayload({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                account: ACCOUNT_ID,
                revokedSessions,
            });

            // Assert
            expect(result).toBe(revokedSessions);
        });

        it("[case] - calculates expiration for session entities", () => {
            // Arrange

            // Act
            const result = mapper.blacklistPayload({ sessions: createSessions() });

            // Assert
            expect(result).toEqual([
                { session: SESSION_ID, expiresAt: new Date("2026-09-15T11:00:00.000Z").getTime() },
                { session: SECOND_SESSION_ID, expiresAt: new Date("2026-09-15T12:00:00.000Z").getTime() },
            ]);
        });
    });

    describe("[Method] - refreshBlacklistPayload", () => {
        it("[case] - calculates expiration after refresh token reuse", () => {
            // Arrange

            // Act
            const result = mapper.refreshBlacklistPayload({ kind: "REUSE_DETECTED", sessions: createSessions() });

            // Assert
            expect(result).toEqual([
                { session: SESSION_ID, expiresAt: new Date("2026-09-15T11:00:00.000Z").getTime() },
                { session: SECOND_SESSION_ID, expiresAt: new Date("2026-09-15T12:00:00.000Z").getTime() },
            ]);
        });

        it.each([
            { kind: "ROTATED", accessToken: "access-token", refreshToken: "refresh-token" } as const,
            {
                kind: "REPLAYED",
                result: {
                    accessToken: "access-token",
                    refreshToken: "refresh-token",
                    message: "commands.session.REFRESHED",
                },
            } as const,
        ])("[case] - returns no blacklist entries for $kind", (props) => {
            // Arrange

            // Act
            const result = mapper.refreshBlacklistPayload(props);

            // Assert
            expect(result).toEqual([]);
        });
    });
});
