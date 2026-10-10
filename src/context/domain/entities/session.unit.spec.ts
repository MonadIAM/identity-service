import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Client } from "~context/enums";

import { Account } from "./account.entity";
import { Session } from "./session.entity";

function createSession(overrides?: Partial<Entities.Session.ConstructorProps>): Session {
    return new Session({
        realms: ["00000001-0000-4000-8000-100000000001"],
        expiresAt: new Date(Date.now() + 3600000),
        userAgent: "Mozilla/5.0",
        account: {} as Account,
        client: Client.WEB_DEV,
        ip: "127.0.0.1",
        acr: "pwd",
        scope: "",
        ...overrides,
    });
}

describe("[Entity] - Session", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const account = {} as Account;
            const expiresAt = new Date(Date.now() + 3600000);

            // Act
            const session = createSession({ account, expiresAt, userAgent: "curl/7.0", ip: "10.0.0.1" });

            // Assert
            expect(session.account).toBe(account);
            expect(session.expiresAt).toBe(expiresAt);
            expect(session.userAgent).toBe("curl/7.0");
            expect(session.client).toBe(Client.WEB_DEV);
            expect(session.ip).toBe("10.0.0.1");
        });

        it("[case] - auto-generates id, createdAt, lastRefreshedAt", () => {
            // Arrange

            // Act
            const session = createSession();
            const result = isUUID(session.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(session.createdAt).toBeInstanceOf(Date);
            expect(session.lastRefreshedAt).toBeInstanceOf(Date);
            expect(session.refreshTokenHash).toBeUndefined();
        });
    });

    describe("[Method] - refresh", () => {
        it("[case] - sets refreshTokenHash and updates lastRefreshedAt", () => {
            // Arrange
            const session = createSession();
            const before = session.lastRefreshedAt;

            // Act
            session.refresh("new-token-hash");
            const result = session.lastRefreshedAt.getTime();

            // Assert
            expect(session.refreshTokenHash).toBe("new-token-hash");
            expect(result).toBeGreaterThanOrEqual(before.getTime());
        });
    });

    describe("[Method] - isExpired", () => {
        it("[case] - throws when session is expired", () => {
            // Arrange
            const session = createSession({ expiresAt: new Date(Date.now() - 1000) });

            // Act
            const act = (): unknown => session.isExpired();

            // Assert
            expect(act).toThrow("EXPIRED");
        });

        it("[case] - does not throw when session is still valid", () => {
            // Arrange
            const session = createSession({ expiresAt: new Date(Date.now() + 3600000) });

            // Act
            const act = (): unknown => session.isExpired();

            // Assert
            expect(act).not.toThrow();
        });
    });
});
