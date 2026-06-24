import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Client } from "~context/enums";

import { Account } from "./account.entity";
import { Session } from "./session.entity";

function createSession(overrides?: Partial<Entities.Session.ConstructorProps>): Session {
    return new Session({
        expiresAt: new Date(Date.now() + 3600000),
        userAgent: "Mozilla/5.0",
        account: {} as Account,
        client: Client.WEB_DEV,
        ip: "127.0.0.1",
        ...overrides,
    });
}

describe("Session Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const account = {} as Account;
            const expiresAt = new Date(Date.now() + 3600000);

            const session = createSession({ account, expiresAt, userAgent: "curl/7.0", ip: "10.0.0.1" });

            expect(session.account).toBe(account);
            expect(session.expiresAt).toBe(expiresAt);
            expect(session.userAgent).toBe("curl/7.0");
            expect(session.client).toBe(Client.WEB_DEV);
            expect(session.ip).toBe("10.0.0.1");
        });

        it("should auto-generate id, createdAt, lastRefreshedAt", () => {
            const session = createSession();

            expect(isUUID(session.id, "4")).toBe(true);
            expect(session.createdAt).toBeInstanceOf(Date);
            expect(session.lastRefreshedAt).toBeInstanceOf(Date);
            expect(session.refreshTokenHash).toBeUndefined();
        });
    });

    describe("refresh", () => {
        it("should set refreshTokenHash and update lastRefreshedAt", () => {
            const session = createSession();
            const before = session.lastRefreshedAt;

            session.refresh("new-token-hash");

            expect(session.refreshTokenHash).toBe("new-token-hash");
            expect(session.lastRefreshedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });
    });

    describe("isExpired", () => {
        it("should throw when session is expired", () => {
            const session = createSession({ expiresAt: new Date(Date.now() - 1000) });

            expect(() => session.isExpired()).toThrow("EXPIRED");
        });

        it("should not throw when session is still valid", () => {
            const session = createSession({ expiresAt: new Date(Date.now() + 3600000) });

            expect(() => session.isExpired()).not.toThrow();
        });
    });
});
