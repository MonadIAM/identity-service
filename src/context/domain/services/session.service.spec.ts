import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { SessionUnitHelpers } from "~testing/unit/domain-service/session.helpers";
import { AccountStatus } from "~context/enums";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID        = "00000000-0000-4000-8000-d00000000001";
const SESSION_ID        = "00000000-0000-4000-8000-d00000000002";
const SECOND_SESSION_ID = "00000000-0000-4000-8000-d00000000003";
const CLIENT_ID         = "00000000-0000-4000-8000-d00000000004";
const REALM_ID          = "00000000-0000-4000-8000-d00000000005";
/* eslint-enable prettier/prettier */

const helpers = new SessionUnitHelpers();

function createInput(
    overrides: Partial<Services.Session.Create.Props["input"]> = {},
): Services.Session.Create.Props["input"] {
    return {
        userAgent: "unit-agent",
        account: ACCOUNT_ID,
        realms: [REALM_ID],
        client: CLIENT_ID,
        scope: "profile",
        ip: "127.0.0.1",
        acr: "1",
        ...overrides,
    };
}

describe("SessionService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("resolves the account when it is given as an id", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });
            const resolveSpy = jest.spyOn(service, "resolveAuthenticatable");

            await service.create({ transaction: transaction.entityManager, input: createInput() });

            expect(resolveSpy).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });
        });

        it("revokes overflowed sessions and reports them with their access token expiry", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const lastRefreshedAt = new Date("2026-01-01T00:00:00.000Z");
            const oldest = helpers.createSession({ id: SESSION_ID, account, lastRefreshedAt });
            const newer = helpers.createSession({ id: SECOND_SESSION_ID, account, lastRefreshedAt });
            const { service, repositories, transaction } = helpers.service({
                accessTokenTTL: "15m",
                maxActiveSessions: 2,
                account,
            });
            repositories.sessions.lockByAccount.mockImplementation(() => Promise.resolve([oldest, newer]));

            const result = await service.create({
                transaction: transaction.entityManager,
                input: createInput({ account }),
            });

            expect(transaction.remove).toHaveBeenCalledWith(oldest);
            expect(transaction.remove).not.toHaveBeenCalledWith(newer);
            expect(result.revokedSessions).toEqual([
                { session: SESSION_ID, expiresAt: lastRefreshedAt.getTime() + 15 * 60 * 1e3 },
            ]);
        });

        it("signs a refresh token, stores its hash on the session and signs an access token", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            const result = await service.create({
                transaction: transaction.entityManager,
                input: createInput({ account }),
            });

            expect(services.jwt.signRefreshToken).toHaveBeenCalledTimes(1);
            expect(services.crypto.hashToken).toHaveBeenCalledWith({ token: "refresh-token" });
            expect(transaction.persist).toHaveBeenCalledWith(
                expect.objectContaining({ refreshTokenHash: "token-hash", client: CLIENT_ID, account }),
            );
            expect(services.jwt.signAccessToken).toHaveBeenCalledTimes(1);
            expect(result.refreshToken).toBe("refresh-token");
            expect(result.accessToken).toBe("access-token");
        });

        it("computes a pairwise subject and signs an id token for the openid scope", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            const result = await service.create({
                input: createInput({ account, scope: "openid profile", nonce: "unit-nonce" }),
                transaction: transaction.entityManager,
            });

            expect(services.jwt.computePairwiseSubject).toHaveBeenCalledWith({
                account: ACCOUNT_ID,
                client: CLIENT_ID,
            });
            expect(services.jwt.signIdToken).toHaveBeenCalledTimes(1);

            const [idTokenCall] = services.jwt.signIdToken.mock.calls;
            expect(idTokenCall[0].payload).toEqual(
                expect.objectContaining({ sub: "pairwise-subject", nonce: "unit-nonce", acr: "1" }),
            );
            expect(idTokenCall[0].props).toEqual({ audience: CLIENT_ID, accessToken: "access-token" });
            expect(result.idToken).toBe("id-token");
        });

        it("skips the id token flow when the scope does not contain openid", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            const result = await service.create({
                input: createInput({ account, scope: "profile email" }),
                transaction: transaction.entityManager,
            });

            expect(services.jwt.computePairwiseSubject).not.toHaveBeenCalled();
            expect(services.jwt.signIdToken).not.toHaveBeenCalled();
            expect(result.idToken).toBeUndefined();
        });
    });

    describe("refresh", () => {
        it("throws invalid_grant when the session does not exist", async () => {
            const { service, transaction } = helpers.service();

            await expect(
                service.refresh({
                    input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.session.SESSION_NOT_FOUND");
        });

        it("throws invalid_grant when the refresh token belongs to another client", async () => {
            const session = helpers.createSession({ id: SESSION_ID, client: "other-client" });
            const { service, repositories, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            await expect(
                service.refresh({
                    input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.session.INVALID_REFRESH_TOKEN");
        });

        it("checks session expiry before rotating", async () => {
            const session = helpers.createSession({ id: SESSION_ID, client: CLIENT_ID });
            session.refresh("token-hash");
            const { service, repositories, transaction } = helpers.service();
            const expiredSpy = jest.spyOn(session, "isExpired");
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            await service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                transaction: transaction.entityManager,
            });

            expect(expiredSpy).toHaveBeenCalledTimes(1);
        });

        it("rotates the tokens and stores the new refresh token hash on a hash match", async () => {
            const session = helpers.createSession({ id: SESSION_ID, client: CLIENT_ID });
            session.refresh("token-hash");
            const { service, repositories, services, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));
            services.crypto.hashToken.mockImplementation(() => "rotated-hash");

            const result = await service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                transaction: transaction.entityManager,
            });

            expect(services.jwt.signRefreshToken).toHaveBeenCalledTimes(1);
            expect(services.jwt.signAccessToken).toHaveBeenCalledTimes(1);
            expect(session.refreshTokenHash).toBe("rotated-hash");
            expect(result).toEqual({
                refreshToken: "refresh-token",
                accessToken: "access-token",
                kind: "ROTATED",
            });
        });

        it("reports reuse detection without issuing tokens when the hash does not match", async () => {
            const session = helpers.createSession({ id: SESSION_ID, client: CLIENT_ID });
            session.refresh("stored-hash");
            const { service, repositories, services, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            const result = await service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "replayed-hash" },
                transaction: transaction.entityManager,
            });

            expect(services.jwt.signRefreshToken).not.toHaveBeenCalled();
            expect(services.jwt.signAccessToken).not.toHaveBeenCalled();
            expect(result).toEqual({ kind: "REUSE_DETECTED", session });
        });
    });

    describe("revoke", () => {
        it("hashes the given token and removes the matching session of the account", async () => {
            const session = helpers.createSession({ id: SESSION_ID });
            const { service, repositories, services, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            const result = await service.revoke({
                input: { token: "refresh-token", account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            expect(services.crypto.hashToken).toHaveBeenCalledWith({ token: "refresh-token" });
            expect(repositories.sessions.findUnique).toHaveBeenCalledWith({
                where: { refreshTokenHash: "token-hash", account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(session);
            expect(result).toEqual([session]);
        });

        it("looks sessions up by the explicit ids of the account when they are given", async () => {
            const session = helpers.createSession({ id: SESSION_ID });
            const { service, repositories, transaction } = helpers.service();
            repositories.sessions.find.mockImplementation(() => Promise.resolve([session]));

            await service.revoke({
                input: { current: SECOND_SESSION_ID, sessions: [SESSION_ID], account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.sessions.find).toHaveBeenCalledWith({
                where: { id: { $in: [SESSION_ID] }, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(session);
        });

        it("removes the given session entities without any repository lookup", async () => {
            const session = helpers.createSession({ id: SESSION_ID });
            const { service, repositories, transaction } = helpers.service();

            const result = await service.revoke({
                transaction: transaction.entityManager,
                input: { sessions: [session] },
            });

            expect(repositories.sessions.findUnique).not.toHaveBeenCalled();
            expect(repositories.sessions.find).not.toHaveBeenCalled();
            expect(transaction.remove).toHaveBeenCalledWith(session);
            expect(result).toEqual([session]);
        });
    });

    describe("revokeAll", () => {
        it("removes every session of the account and returns them", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const sessions = [
                helpers.createSession({ id: SESSION_ID, account }),
                helpers.createSession({ id: SECOND_SESSION_ID, account }),
            ];
            account.sessions = helpers.collection({ owner: account, items: sessions });
            const { service, repositories, transaction } = helpers.service({ account });

            const result = await service.revokeAll({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                options: { populate: ["sessions"] },
                where: { id: ACCOUNT_ID },
            });
            expect(transaction.remove).toHaveBeenNthCalledWith(1, sessions[0]);
            expect(transaction.remove).toHaveBeenNthCalledWith(2, sessions[1]);
            expect(result).toEqual(sessions);
        });
    });

    describe("resolveAuthenticatable", () => {
        it.each([AccountStatus.SUSPENDED, AccountStatus.PENDING])("throws for a %s account", async (status) => {
            const account = helpers.createAccount({ id: ACCOUNT_ID, status });
            const { service, transaction } = helpers.service({ account });

            await expect(
                service.resolveAuthenticatable({
                    transaction: transaction.entityManager,
                    input: { account: ACCOUNT_ID },
                }),
            ).rejects.toThrow("services.session.ACCOUNT_NOT_AUTHENTICATABLE");
        });

        it("restores a deactivated account before authenticating it", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID, status: AccountStatus.DEACTIVATED });
            const { service, transaction } = helpers.service({ account });
            const restoreSpy = jest.spyOn(account, "restore");

            await service.resolveAuthenticatable({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(restoreSpy).toHaveBeenCalledTimes(1);
            expect(account.status).toBe(AccountStatus.ACTIVE);
        });

        it("touches the account and returns it", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });
            const touchSpy = jest.spyOn(account, "touch");

            const result = await service.resolveAuthenticatable({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            expect(touchSpy).toHaveBeenCalledTimes(1);
            expect(account.lastActiveAt).toBeInstanceOf(Date);
            expect(result).toBe(account);
        });
    });
});
