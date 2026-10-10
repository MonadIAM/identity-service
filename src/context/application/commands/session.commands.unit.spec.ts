import { describe, expect, it } from "@jest/globals";

import { SessionCommandsUnitHelpers } from "~testing/unit/command-services/session.helpers";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new SessionCommandsUnitHelpers();
const ACCOUNT = "target-account";
const ACTOR = "actor-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("[Commands] - Session", () => {
    describe("[Method] - create", () => {
        it("[case] - creates a session with request metadata while exposing only its tokens", async () => {
            // Arrange
            const { commands, sessionService, transaction } = await helpers.commands();
            const input = { account: ACCOUNT, client: ID, realms: [REALM], scope: "openid", acr: "1", nonce: "nonce" };
            sessionService.create.mockResolvedValue({
                refreshToken: "refresh",
                accessToken: "access",
                idToken: "id-token",
                revokedSessions: [],
            });

            // Act
            const result = await commands.create({ input, context: CONTEXT });

            // Assert
            expect(sessionService.create.mock.calls).toEqual([
                [{ input: { ...input, ...CONTEXT }, transaction: transaction.entityManager }],
            ]);
            expect(result).toEqual({ accessToken: "access", refreshToken: "refresh", idToken: "id-token" });
        });
    });

    describe("[Method] - refresh", () => {
        it("[case] - rejects a missing refresh token before touching the cache or transaction", async () => {
            // Arrange
            const { commands, refreshIdempotencyService, run } = await helpers.commands();

            // Act
            const result = commands.refresh({ input: { client: ID }, context: CONTEXT });

            // Assert
            await expect(result).rejects.toThrow();
            expect(refreshIdempotencyService.get).not.toHaveBeenCalled();
            expect(run).not.toHaveBeenCalled();
        });

        it("[case] - returns a cached refresh without verifying or rotating the token again", async () => {
            // Arrange
            const { commands, refreshIdempotencyService, cryptoService, jwtService, run } = await helpers.commands();
            const cached = {
                message: "commands.session.REFRESHED" as const,
                accessToken: "access",
                refreshToken: "new-refresh",
            };
            cryptoService.hashToken.mockReturnValue("cache-key");
            refreshIdempotencyService.get.mockResolvedValue(cached);

            // Act
            const result = await commands.refresh({ input: { client: ID, refreshToken: "old-refresh" }, context: CONTEXT });

            // Assert
            expect(result).toBe(cached);
            expect(cryptoService.hashToken.mock.calls).toEqual([[{ token: `${ID}:old-refresh` }]]);
            expect(refreshIdempotencyService.get.mock.calls).toEqual([[{ key: "cache-key" }]]);
            expect(jwtService.verifyRefresh).not.toHaveBeenCalled();
            expect(run).not.toHaveBeenCalled();
        });

        it("[case] - caches the rotated tokens after the transaction completes", async () => {
            // Arrange
            const { commands, refreshIdempotencyService, cryptoService, jwtService, sessionService, transaction } =
                await helpers.commands();
            cryptoService.hashToken.mockReturnValueOnce("cache-key").mockReturnValueOnce("token-hash");
            refreshIdempotencyService.get.mockResolvedValue(null);
            jwtService.verifyRefresh.mockResolvedValue({ sid: "session-id" });
            sessionService.refresh.mockResolvedValue({
                kind: "ROTATED",
                accessToken: "access",
                refreshToken: "new-refresh",
            });

            // Act
            const result = await commands.refresh({ input: { client: ID, refreshToken: "old-refresh" }, context: CONTEXT });

            // Assert
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

        it.each([false, true])(
            "[case] - distinguishes token reuse from a concurrent successful refresh: %s",
            async (raced) => {
                // Arrange
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

                // Act
                const result = commands.refresh({ input: { client: ID, refreshToken: "old-refresh" }, context: CONTEXT });

                // Assert
                if (raced) {
                    await expect(result).resolves.toBe(cached);
                    expect(sessionService.revoke).not.toHaveBeenCalled();
                } else {
                    await expect(result).rejects.toThrow();
                    expect(sessionService.revoke.mock.calls).toEqual([
                        [{ input: { sessions: [session] }, transaction: transaction.entityManager }],
                    ]);
                    await expect(run.mock.results[0]?.value).resolves.toEqual({
                        kind: "REUSE_DETECTED",
                        sessions: [session],
                    });
                }
                expect(refreshIdempotencyService.set).not.toHaveBeenCalled();
            },
        );
    });

    describe("[Method] - revoke", () => {
        it.each([
            { input: { token: "refresh" }, expected: { account: ACTOR, token: "refresh" } },
            {
                input: { sessions: ["other-session"] },
                expected: { account: ACTOR, current: ID, sessions: ["other-session"] },
            },
            { input: {}, expected: { account: ACTOR, current: ID, sessions: undefined } },
        ])("[case] - restricts revocation to the actor using $input", async ({ input, expected }) => {
            // Arrange
            const { commands, sessionService, transaction } = await helpers.commands();
            sessionService.revoke.mockResolvedValue([]);

            // Act
            await commands.revoke({ input, actor: ACTOR, session: ID, context: CONTEXT });

            // Assert
            expect(sessionService.revoke.mock.calls).toEqual([
                [{ input: expected, transaction: transaction.entityManager }],
            ]);
        });
    });

    describe("[Method] - revokeAll", () => {
        it("[case] - revokes all sessions only for the authenticated account", async () => {
            // Arrange
            const { commands, sessionService, transaction } = await helpers.commands();
            sessionService.revokeAll.mockResolvedValue([]);

            // Act
            await commands.revokeAll({ actor: ACTOR, context: CONTEXT });

            // Assert
            expect(sessionService.revokeAll.mock.calls).toEqual([
                [{ input: { account: ACTOR }, transaction: transaction.entityManager }],
            ]);
        });
    });
});
