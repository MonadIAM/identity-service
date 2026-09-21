import { describe, expect, it } from "@jest/globals";

import { SessionCommandsUnitHelpers } from "~testing/unit/command-services/session.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new SessionCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("SessionCommands", () => {
    it("creates a session with request metadata while exposing only its tokens", async () => {
        const { commands, sessionService, transaction } = await helpers.commands();
        const input = { account: ACCOUNT, client: ID, realms: [REALM], scope: "openid", acr: "1", nonce: "nonce" };
        sessionService.create.mockResolvedValue({
            refreshToken: "refresh",
            accessToken: "access",
            idToken: "id-token",
            revokedSessions: [],
        });

        const result = await commands.create({ input, context: CONTEXT });

        expect(sessionService.create.mock.calls).toEqual([
            [{ input: { ...input, ...CONTEXT }, transaction: transaction.entityManager }],
        ]);
        expect(result).toEqual({ accessToken: "access", refreshToken: "refresh", idToken: "id-token" });
    });

    it("rejects a missing refresh token before touching the cache or transaction", async () => {
        const { commands, refreshIdempotencyService, run } = await helpers.commands();

        await expect(commands.refresh({ input: { client: ID }, context: CONTEXT })).rejects.toThrow();

        expect(refreshIdempotencyService.get).not.toHaveBeenCalled();
        expect(run).not.toHaveBeenCalled();
    });

    it("returns a cached refresh without verifying or rotating the token again", async () => {
        const { commands, refreshIdempotencyService, cryptoService, jwtService, run } = await helpers.commands();
        const cached = {
            message: "commands.session.REFRESHED" as const,
            accessToken: "access",
            refreshToken: "new-refresh",
        };
        cryptoService.hashToken.mockReturnValue("cache-key");
        refreshIdempotencyService.get.mockResolvedValue(cached);

        const result = await commands.refresh({ input: { client: ID, refreshToken: "old-refresh" }, context: CONTEXT });

        expect(result).toBe(cached);
        expect(cryptoService.hashToken.mock.calls).toEqual([[{ token: `${ID}:old-refresh` }]]);
        expect(refreshIdempotencyService.get.mock.calls).toEqual([[{ key: "cache-key" }]]);
        expect(jwtService.verifyRefresh).not.toHaveBeenCalled();
        expect(run).not.toHaveBeenCalled();
    });

    it("caches the rotated tokens after the transaction completes", async () => {
        const { commands, refreshIdempotencyService, cryptoService, jwtService, sessionService, transaction } =
            await helpers.commands();
        cryptoService.hashToken.mockReturnValueOnce("cache-key").mockReturnValueOnce("token-hash");
        refreshIdempotencyService.get.mockResolvedValue(null);
        jwtService.verifyRefresh.mockResolvedValue({ sid: "session-id" });
        sessionService.refresh.mockResolvedValue({ kind: "ROTATED", accessToken: "access", refreshToken: "new-refresh" });

        const result = await commands.refresh({ input: { client: ID, refreshToken: "old-refresh" }, context: CONTEXT });

        expect(sessionService.refresh.mock.calls).toEqual([
            [
                {
                    input: { session: "session-id", client: ID, tokenHash: "token-hash" },
                    transaction: transaction.entityManager,
                },
            ],
        ]);
        expect(refreshIdempotencyService.set.mock.calls).toEqual([[{ key: "cache-key", result }]]);
        expect(result).toEqual(expect.objectContaining({ accessToken: "access", refreshToken: "new-refresh" }));
        expect(sessionService.revoke).not.toHaveBeenCalled();
    });

    it.each([false, true])("distinguishes token reuse from a concurrent successful refresh: %s", async (raced) => {
        const { commands, refreshIdempotencyService, cryptoService, jwtService, sessionService, transaction, run } =
            await helpers.commands();
        const session = helpers.createSession();
        const cached = {
            message: "commands.session.REFRESHED" as const,
            accessToken: "access",
            refreshToken: "new-refresh",
        };
        cryptoService.hashToken.mockReturnValue("hash");
        jwtService.verifyRefresh.mockResolvedValue({ sid: "session-id" });
        refreshIdempotencyService.get.mockResolvedValueOnce(null).mockResolvedValueOnce(raced ? cached : null);
        sessionService.refresh.mockResolvedValue({ kind: "REUSE_DETECTED", session });
        sessionService.revoke.mockResolvedValue([session]);

        const result = commands.refresh({ input: { client: ID, refreshToken: "old-refresh" }, context: CONTEXT });

        if (raced) {
            await expect(result).resolves.toBe(cached);
            expect(sessionService.revoke).not.toHaveBeenCalled();
        } else {
            await expect(result).rejects.toThrow();
            expect(sessionService.revoke.mock.calls).toEqual([
                [{ input: { sessions: [session] }, transaction: transaction.entityManager }],
            ]);
            await expect(run.mock.results[0]?.value).resolves.toEqual({ kind: "REUSE_DETECTED", sessions: [session] });
        }
        expect(refreshIdempotencyService.set).not.toHaveBeenCalled();
    });

    it.each([
        { input: { token: "refresh" }, expected: { account: ACTOR, token: "refresh" } },
        { input: { sessions: ["other-session"] }, expected: { account: ACTOR, current: ID, sessions: ["other-session"] } },
        { input: {}, expected: { account: ACTOR, current: ID, sessions: undefined } },
    ])("restricts revocation to the actor using $input", async ({ input, expected }) => {
        const { commands, sessionService, transaction } = await helpers.commands();
        sessionService.revoke.mockResolvedValue([]);

        await commands.revoke({ input, actor: ACTOR, session: ID, context: CONTEXT });

        expect(sessionService.revoke.mock.calls).toEqual([[{ input: expected, transaction: transaction.entityManager }]]);
    });

    it("revokes all sessions only for the authenticated account", async () => {
        const { commands, sessionService, transaction } = await helpers.commands();
        sessionService.revokeAll.mockResolvedValue([]);

        await commands.revokeAll({ actor: ACTOR, context: CONTEXT });

        expect(sessionService.revokeAll.mock.calls).toEqual([
            [{ input: { account: ACTOR }, transaction: transaction.entityManager }],
        ]);
    });
});
