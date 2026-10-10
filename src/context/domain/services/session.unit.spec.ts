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

describe("[DomainService] - Session", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - resolves the account when it is given as an id", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });
            const resolveSpy = jest.spyOn(service, "resolveAuthenticatable");

            // Act
            await service.create({ transaction: transaction.entityManager, input: createInput() });

            // Assert
            expect(resolveSpy).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });
        });

        it("[case] - revokes overflowed sessions and reports them with their access token expiry", async () => {
            // Arrange
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

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                input: createInput({ account }),
            });

            // Assert
            expect(transaction.remove).toHaveBeenCalledWith(oldest);
            expect(transaction.remove).not.toHaveBeenCalledWith(newer);
            expect(result.revokedSessions).toEqual([
                { session: SESSION_ID, expiresAt: lastRefreshedAt.getTime() + 15 * 60 * 1e3 },
            ]);
        });

        it("[case] - signs a refresh token, stores its hash on the session and signs an access token", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                input: createInput({ account }),
            });

            // Assert
            expect(services.jwt.signRefreshToken).toHaveBeenCalledTimes(1);
            expect(services.crypto.hashToken).toHaveBeenCalledWith({ token: "refresh-token" });
            expect(transaction.persist).toHaveBeenCalledWith(
                expect.objectContaining({ refreshTokenHash: "token-hash", client: CLIENT_ID, account }),
            );
            expect(services.jwt.signAccessToken).toHaveBeenCalledTimes(1);
            expect(result.refreshToken).toBe("refresh-token");
            expect(result.accessToken).toBe("access-token");
        });

        it("[case] - computes a pairwise subject and signs an id token for the openid scope", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            // Act
            const result = await service.create({
                input: createInput({ account, scope: "openid profile", nonce: "unit-nonce" }),
                transaction: transaction.entityManager,
            });
            const result1 = services.jwt.computePairwiseSubject;
            const result2 = services.jwt.signIdToken;
            const [idTokenCall] = services.jwt.signIdToken.mock.calls;

            // Assert
            expect(result1).toHaveBeenCalledWith({
                account: ACCOUNT_ID,
                client: CLIENT_ID,
            });
            expect(result2).toHaveBeenCalledTimes(1);
            expect(idTokenCall[0].payload).toEqual(
                expect.objectContaining({ sub: "pairwise-subject", nonce: "unit-nonce", acr: "1" }),
            );
            expect(idTokenCall[0].props).toEqual({ audience: CLIENT_ID, accessToken: "access-token" });
            expect(result.idToken).toBe("id-token");
        });

        it("[case] - skips the id token flow when the scope does not contain openid", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, services, transaction } = helpers.service({ account });

            // Act
            const result = await service.create({
                input: createInput({ account, scope: "profile email" }),
                transaction: transaction.entityManager,
            });

            // Assert
            expect(services.jwt.computePairwiseSubject).not.toHaveBeenCalled();
            expect(services.jwt.signIdToken).not.toHaveBeenCalled();
            expect(result.idToken).toBeUndefined();
        });
    });

    describe("[Method] - refresh", () => {
        it("[case] - throws invalid_grant when the session does not exist", async () => {
            // Arrange
            const { service, transaction } = helpers.service();

            // Act
            const result = service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                transaction: transaction.entityManager,
            });

            // Assert
            await expect(result).rejects.toThrow("services.session.SESSION_NOT_FOUND");
        });

        it("[case] - throws invalid_grant when the refresh token belongs to another client", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID, client: "other-client" });
            const { service, repositories, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            // Act
            const result = service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                transaction: transaction.entityManager,
            });

            // Assert
            await expect(result).rejects.toThrow("services.session.INVALID_REFRESH_TOKEN");
        });

        it("[case] - checks session expiry before rotating", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID, client: CLIENT_ID });
            session.refresh("token-hash");
            const { service, repositories, transaction } = helpers.service();
            const expiredSpy = jest.spyOn(session, "isExpired");
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            // Act
            await service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(expiredSpy).toHaveBeenCalledTimes(1);
        });

        it("[case] - rotates the tokens and stores the new refresh token hash on a hash match", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID, client: CLIENT_ID });
            session.refresh("token-hash");
            const { service, repositories, services, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));
            services.crypto.hashToken.mockImplementation(() => "rotated-hash");

            // Act
            const result = await service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "token-hash" },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(services.jwt.signRefreshToken).toHaveBeenCalledTimes(1);
            expect(services.jwt.signAccessToken).toHaveBeenCalledTimes(1);
            expect(session.refreshTokenHash).toBe("rotated-hash");
            expect(result).toEqual({
                refreshToken: "refresh-token",
                accessToken: "access-token",
                kind: "ROTATED",
            });
        });

        it("[case] - reports reuse detection without issuing tokens when the hash does not match", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID, client: CLIENT_ID });
            session.refresh("stored-hash");
            const { service, repositories, services, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            // Act
            const result = await service.refresh({
                input: { session: SESSION_ID, client: CLIENT_ID, tokenHash: "replayed-hash" },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(services.jwt.signRefreshToken).not.toHaveBeenCalled();
            expect(services.jwt.signAccessToken).not.toHaveBeenCalled();
            expect(result).toEqual({ kind: "REUSE_DETECTED", session });
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - hashes the given token and removes the matching session of the account", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID });
            const { service, repositories, services, transaction } = helpers.service();
            repositories.sessions.findUnique.mockImplementation(() => Promise.resolve(session));

            // Act
            const result = await service.revoke({
                input: { token: "refresh-token", account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(services.crypto.hashToken).toHaveBeenCalledWith({ token: "refresh-token" });
            expect(repositories.sessions.findUnique).toHaveBeenCalledWith({
                where: { refreshTokenHash: "token-hash", account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(session);
            expect(result).toEqual([session]);
        });

        it("[case] - looks sessions up by the explicit ids of the account when they are given", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID });
            const { service, repositories, transaction } = helpers.service();
            repositories.sessions.find.mockImplementation(() => Promise.resolve([session]));

            // Act
            await service.revoke({
                input: { current: SECOND_SESSION_ID, sessions: [SESSION_ID], account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });

            // Assert
            expect(repositories.sessions.find).toHaveBeenCalledWith({
                where: { id: { $in: [SESSION_ID] }, account: ACCOUNT_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(session);
        });

        it("[case] - removes the given session entities without any repository lookup", async () => {
            // Arrange
            const session = helpers.createSession({ id: SESSION_ID });
            const { service, repositories, transaction } = helpers.service();

            // Act
            const result = await service.revoke({
                transaction: transaction.entityManager,
                input: { sessions: [session] },
            });

            // Assert
            expect(repositories.sessions.findUnique).not.toHaveBeenCalled();
            expect(repositories.sessions.find).not.toHaveBeenCalled();
            expect(transaction.remove).toHaveBeenCalledWith(session);
            expect(result).toEqual([session]);
        });
    });

    describe("[Method] - revokeAll", () => {
        it("[case] - removes every session of the account and returns them", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const sessions = [
                helpers.createSession({ id: SESSION_ID, account }),
                helpers.createSession({ id: SECOND_SESSION_ID, account }),
            ];
            account.sessions = helpers.collection({ owner: account, items: sessions });
            const { service, repositories, transaction } = helpers.service({ account });

            // Act
            const result = await service.revokeAll({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            // Assert
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

    describe("[Method] - resolveAuthenticatable", () => {
        it.each([AccountStatus.SUSPENDED, AccountStatus.PENDING])("[case] - throws for a %s account", async (status) => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID, status });
            const { service, transaction } = helpers.service({ account });

            // Act
            const result = service.resolveAuthenticatable({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            // Assert
            await expect(result).rejects.toThrow("services.session.ACCOUNT_NOT_AUTHENTICATABLE");
        });

        it("[case] - restores a deactivated account before authenticating it", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID, status: AccountStatus.DEACTIVATED });
            const { service, transaction } = helpers.service({ account });
            const restoreSpy = jest.spyOn(account, "restore");

            // Act
            await service.resolveAuthenticatable({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            // Assert
            expect(restoreSpy).toHaveBeenCalledTimes(1);
            expect(account.status).toBe(AccountStatus.ACTIVE);
        });

        it("[case] - touches the account and returns it", async () => {
            // Arrange
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            const { service, transaction } = helpers.service({ account });
            const touchSpy = jest.spyOn(account, "touch");

            // Act
            const result = await service.resolveAuthenticatable({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
            });

            // Assert
            expect(touchSpy).toHaveBeenCalledTimes(1);
            expect(account.lastActiveAt).toBeInstanceOf(Date);
            expect(result).toBe(account);
        });
    });
});
