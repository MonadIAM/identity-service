import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { SessionFixture } from "~testing/integration/repositories/session.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

import { SessionRepository } from "./session.repository";

function requireCallback(callback: Optional<() => void>): () => void {
    if (callback) {
        return callback;
    } else {
        throw new Error("Lock test callback is not initialized");
    }
}

describe("SessionRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new SessionRepository(readManager),
        fixture: (entityManager) => new SessionFixture(entityManager),
    });

    describe("findUniqueOrThrow", () => {
        it("maps the persisted session through the schema", async () => {
            const account = await suite.fixtures().createAccount();
            const realms = [randomUUID(), randomUUID()];
            const session = await suite.fixtures().createSession({
                lastRefreshedAt: new Date("2026-02-01T00:00:00.000Z"),
                expiresAt: new Date("2027-01-01T00:00:00.000Z"),
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                refreshTokenHash: "mapping-refresh-hash",
                userAgent: "mapping-agent",
                client: "mapping-client",
                scope: "openid profile",
                ip: "192.168.10.20",
                account,
                realms,
            });

            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: session.id } });

            expect(loaded).toMatchObject({
                lastRefreshedAt: new Date("2026-02-01T00:00:00.000Z"),
                expiresAt: new Date("2027-01-01T00:00:00.000Z"),
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                refreshTokenHash: "mapping-refresh-hash",
                userAgent: "mapping-agent",
                client: "mapping-client",
                scope: "openid profile",
                ip: "192.168.10.20",
                acr: session.acr,
                id: session.id,
                realms,
            });
            expect(loaded.account.id).toBe(account.id);
        });
    });

    describe("lockByAccount", () => {
        it("locks account and returns sessions ordered by refresh time", async () => {
            const { account, external, first, second, third } = await suite.fixtures().lockScenario();

            await suite.transaction(async (transaction) => {
                const sessions = await suite.repository().lockByAccount({
                    transaction,
                    account: account.id,
                });

                expect(sessions.map(({ id }) => id)).toEqual([first.id, second.id, third.id]);
                expect(sessions.map(({ id }) => id)).not.toContain(external.id);
            });
        });

        it("blocks concurrent locks until the holding transaction is released", async () => {
            const { account, first, second, third } = await suite.fixtures().lockScenario();
            let lockAcquired: Optional<() => void>;
            let releaseLock: Optional<() => void>;
            const lockAcquiredPromise = new Promise<void>((resolve) => {
                lockAcquired = resolve;
            });
            const releaseLockPromise = new Promise<void>((resolve) => {
                releaseLock = resolve;
            });

            const holdingTransaction = suite.transaction(async (transaction) => {
                await suite.repository().lockByAccount({
                    transaction,
                    account: account.id,
                });
                requireCallback(lockAcquired)();
                await releaseLockPromise;
            });

            await lockAcquiredPromise;

            const concurrentLockTimeoutMessage = "Concurrent lock attempt did not finish";
            const concurrentLockAttempt = suite.transaction(async (transaction) => {
                await transaction.execute("SET LOCAL lock_timeout = '100ms'", [], "run");
                await suite.repository().lockByAccount({
                    account: account.id,
                    transaction,
                });
            });
            let blockedError: unknown;
            try {
                await Promise.race([
                    concurrentLockAttempt,
                    new Promise<never>((_, reject) => {
                        setTimeout(() => reject(new Error(concurrentLockTimeoutMessage)), 5_000);
                    }),
                ]);
            } catch (error) {
                blockedError = error;
            } finally {
                requireCallback(releaseLock)();
                await holdingTransaction;
                await concurrentLockAttempt.catch(() => undefined);
            }

            if (!(blockedError instanceof Error)) {
                throw new Error("Concurrent lock attempt was not blocked");
            }
            if (blockedError.message === concurrentLockTimeoutMessage) {
                throw blockedError;
            }

            await suite.transaction(async (transaction) => {
                const sessions = await suite.repository().lockByAccount({
                    transaction,
                    account: account.id,
                });

                expect(sessions.map(({ id }) => id)).toEqual([first.id, second.id, third.id]);
            });
        });

        it("returns empty list when account is missing", async () => {
            await suite.transaction(async (transaction) => {
                await expect(
                    suite.repository().lockByAccount({
                        transaction,
                        account: randomUUID(),
                    }),
                ).resolves.toEqual([]);
            });
        });
    });
});
