import { describe, expect, it } from "@jest/globals";

import { SessionIntegrationHelpers } from "~testing/integration/domain-service/session.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { AccountStatus, AuthenticationContextClass } from "~context/enums";
import { Account, Session } from "~context/domain/entities";

const CLIENT_ID = "identity-test-client";
const REALM_ID = "00000000-0000-4000-8000-000000000001";
const helpers = new SessionIntegrationHelpers();

function createInput(
    account: Entities.Account | string,
    overrides: Partial<Services.Session.Create.Props["input"]> = {},
): Services.Session.Create.Props["input"] {
    return {
        acr: AuthenticationContextClass.PASSWORD,
        userAgent: "integration-agent",
        scope: "openid profile",
        realms: [REALM_ID],
        client: CLIENT_ID,
        ip: "127.0.0.1",
        account,
        ...overrides,
    };
}

async function loadSessions(
    suite: Integration.Domain.Session.Suite,
    account: Entities.Account,
): Promise<Entities.Session[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            Session,
            { account: account.id },
            {
                orderBy: [{ lastRefreshedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
            },
        ),
    );
}

async function loadAccount(suite: Integration.Domain.Session.Suite, account: Entities.Account): Promise<Entities.Account> {
    return await suite.transaction((transaction) =>
        transaction.findOneOrFail(Account, {
            id: account.id,
        }),
    );
}

describe("SessionService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates a persisted session with token hashes and an OIDC id token", async () => {
        const account = await suite.fixtures().createAccount();

        const result = await suite.transaction((transaction) =>
            suite.repository().sessionService.create({
                input: createInput(account.id, { nonce: "session-nonce" }),
                transaction,
            }),
        );

        const sessions = await loadSessions(suite, account);
        const refreshed = await loadAccount(suite, account);
        const created = sessions[0];

        expect(sessions).toHaveLength(1);
        expect(created).toBeDefined();
        expect(created?.refreshTokenHash).toBe(`hash:${result.refreshToken}`);
        expect(result.accessToken).toBe(`access:${created?.id}:1`);
        expect(result.idToken).toBe(`id:${created?.id}:pairwise:${CLIENT_ID}:${account.id}:1`);
        expect(result.revokedSessions).toEqual([]);
        expect(refreshed.lastActiveAt).toBeInstanceOf(Date);
    });

    it("removes the oldest persisted session on a single overflow", async () => {
        const account = await suite.fixtures().createAccount();
        const oldest = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        const newer = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-02T00:00:00.000Z"),
        });
        const newest = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-03T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-03T00:00:00.000Z"),
        });

        const result = await suite.transaction((transaction) =>
            suite.repository().sessionService.create({
                input: createInput(account.id),
                transaction,
            }),
        );

        const sessions = await loadSessions(suite, account);
        const ids = sessions.map(({ id }) => id);

        expect(sessions).toHaveLength(3);
        expect(ids).not.toContain(oldest.id);
        expect(ids).toEqual(expect.arrayContaining([newer.id, newest.id]));
        expect(result.revokedSessions).toEqual([
            {
                expiresAt: oldest.lastRefreshedAt.getTime() + 15 * 60 * 1e3,
                session: oldest.id,
            },
        ]);
    });

    it("keeps the session limit under two concurrent logins", async () => {
        const account = await suite.fixtures().createAccount();
        const oldest = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        const kept = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-02T00:00:00.000Z"),
        });

        const [first, second] = await Promise.all([
            suite.transaction((transaction) =>
                suite.repository().sessionService.create({
                    input: createInput(account.id, {
                        userAgent: "concurrent-agent-1",
                    }),
                    transaction,
                }),
            ),
            suite.transaction((transaction) =>
                suite.repository().sessionService.create({
                    input: createInput(account.id, {
                        userAgent: "concurrent-agent-2",
                    }),
                    transaction,
                }),
            ),
        ]);

        const sessions = await loadSessions(suite, account);
        const ids = sessions.map(({ id }) => id);
        const revokedIds = [...first.revokedSessions, ...second.revokedSessions].map(({ session }) => session);

        expect(sessions).toHaveLength(3);
        expect(ids).toContain(kept.id);
        expect(ids).not.toContain(oldest.id);
        expect(revokedIds).toEqual([oldest.id]);
        expect(new Set(revokedIds).size).toBe(revokedIds.length);
        expect(first.refreshToken).toMatch(/^refresh:/);
        expect(first.accessToken).toMatch(/^access:/);
        expect(second.refreshToken).toMatch(/^refresh:/);
        expect(second.accessToken).toMatch(/^access:/);
    });

    it("rolls back a new session and overflow removals when access token signing fails", async () => {
        const account = await suite.fixtures().createAccount();
        const first = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        const second = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-02T00:00:00.000Z"),
        });
        const third = await suite.fixtures().createSession({
            account,
            createdAt: new Date("2026-01-03T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-03T00:00:00.000Z"),
        });
        suite.repository().services.jwt.setFailure("access");

        await expect(
            suite.transaction((transaction) =>
                suite.repository().sessionService.create({
                    input: createInput(account.id),
                    transaction,
                }),
            ),
        ).rejects.toThrow("access token signing failed");

        const sessions = await loadSessions(suite, account);
        const ids = sessions.map(({ id }) => id);

        expect(ids).toEqual([first.id, second.id, third.id]);
    });

    it("rotates refresh tokens on a matching hash and detects token reuse on mismatch", async () => {
        const account = await suite.fixtures().createAccount();
        const session = await suite.fixtures().createSession({
            refreshTokenHash: "stored-refresh-hash",
            account,
            client: CLIENT_ID,
        });

        const rotated = await suite.transaction((transaction) =>
            suite.repository().sessionService.refresh({
                input: {
                    session: session.id,
                    client: CLIENT_ID,
                    tokenHash: "stored-refresh-hash",
                },
                transaction,
            }),
        );
        const afterRotate = await loadSessions(suite, account);
        const reuse = await suite.transaction((transaction) =>
            suite.repository().sessionService.refresh({
                input: {
                    session: session.id,
                    client: CLIENT_ID,
                    tokenHash: "stale-refresh-hash",
                },
                transaction,
            }),
        );
        const afterReuse = await loadSessions(suite, account);

        if (rotated.kind !== "ROTATED") {
            throw new Error("Expected refresh token rotation");
        }

        expect(rotated).toMatchObject({
            kind: "ROTATED",
            accessToken: `access:${session.id}:1`,
            refreshToken: `refresh:${session.id}:1`,
        });
        expect(afterRotate[0]?.refreshTokenHash).toBe(`hash:${rotated.refreshToken}`);
        expect(reuse.kind).toBe("REUSE_DETECTED");
        expect(afterReuse[0]?.refreshTokenHash).toBe(afterRotate[0]?.refreshTokenHash);
    });

    it("revokes a session by refresh token", async () => {
        const account = await suite.fixtures().createAccount();
        const session = await suite.fixtures().createSession({
            refreshTokenHash: "hash:token-to-revoke",
            account,
        });
        const kept = await suite.fixtures().createSession({ account });

        const removed = await suite.transaction((transaction) =>
            suite.repository().sessionService.revoke({
                input: { account: account.id, token: "token-to-revoke" },
                transaction,
            }),
        );

        const sessions = await loadSessions(suite, account);

        expect(removed.map(({ id }) => id)).toEqual([session.id]);
        expect(sessions.map(({ id }) => id)).toEqual([kept.id]);
    });

    it("revokes the current session by id", async () => {
        const account = await suite.fixtures().createAccount();
        const current = await suite.fixtures().createSession({ account });
        const kept = await suite.fixtures().createSession({ account });

        const removed = await suite.transaction((transaction) =>
            suite.repository().sessionService.revoke({
                input: { account: account.id, current: current.id },
                transaction,
            }),
        );

        const sessions = await loadSessions(suite, account);

        expect(removed.map(({ id }) => id)).toEqual([current.id]);
        expect(sessions.map(({ id }) => id)).toEqual([kept.id]);
    });

    it("revokes explicit sessions without removing the current session", async () => {
        const account = await suite.fixtures().createAccount();
        const current = await suite.fixtures().createSession({ account });
        const explicit = await suite.fixtures().createSession({ account });

        const removed = await suite.transaction((transaction) =>
            suite.repository().sessionService.revoke({
                input: {
                    account: account.id,
                    current: current.id,
                    sessions: [explicit.id],
                },
                transaction,
            }),
        );

        const sessions = await loadSessions(suite, account);

        expect(removed.map(({ id }) => id)).toEqual([explicit.id]);
        expect(sessions.map(({ id }) => id)).toEqual([current.id]);
    });

    it("revokes managed session entities", async () => {
        const account = await suite.fixtures().createAccount();
        const session = await suite.fixtures().createSession({ account });

        const removed = await suite.transaction(async (transaction) =>
            suite.repository().sessionService.revoke({
                input: {
                    sessions: [
                        await transaction.findOneOrFail(Session, {
                            id: session.id,
                        }),
                    ],
                },
                transaction,
            }),
        );

        const sessions = await loadSessions(suite, account);

        expect(removed.map(({ id }) => id)).toEqual([session.id]);
        expect(sessions).toHaveLength(0);
    });

    it("revokes all sessions for one account without touching another account", async () => {
        const account = await suite.fixtures().createAccount();
        const other = await suite.fixtures().createAccount();
        const first = await suite.fixtures().createSession({ account });
        const second = await suite.fixtures().createSession({ account });
        const external = await suite.fixtures().createSession({ account: other });

        const removed = await suite.transaction((transaction) =>
            suite.repository().sessionService.revokeAll({
                input: { account: account.id },
                transaction,
            }),
        );

        const accountSessions = await loadSessions(suite, account);
        const otherSessions = await loadSessions(suite, other);

        expect(removed.map(({ id }) => id).sort()).toEqual([first.id, second.id].sort());
        expect(accountSessions).toHaveLength(0);
        expect(otherSessions.map(({ id }) => id)).toEqual([external.id]);
    });

    it.each([AccountStatus.SUSPENDED, AccountStatus.PENDING])(
        "does not create a session for a %s account",
        async (status) => {
            const account = await suite.fixtures().createAccount({ status });

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().sessionService.create({
                        input: createInput(account.id),
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.session.ACCOUNT_NOT_AUTHENTICATABLE");

            await expect(loadSessions(suite, account)).resolves.toHaveLength(0);
        },
    );

    it("restores a deactivated account when creating a session", async () => {
        const account = await suite.fixtures().createAccount({ status: AccountStatus.DEACTIVATED });

        await suite.transaction((transaction) =>
            suite.repository().sessionService.create({
                input: createInput(account.id),
                transaction,
            }),
        );

        const restored = await loadAccount(suite, account);
        const sessions = await loadSessions(suite, account);

        expect(restored.status).toBe(AccountStatus.ACTIVE);
        expect(restored.lastActiveAt).toBeInstanceOf(Date);
        expect(restored.updatedAt).toBeInstanceOf(Date);
        expect(sessions).toHaveLength(1);
    });
});
