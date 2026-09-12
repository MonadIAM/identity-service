import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { InviteUnitHelpers } from "~testing/unit/domain-service/invite.helpers";
import { InviteStatus } from "~context/enums";

/* eslint-disable prettier/prettier */
const REALM_ID         = "00000000-0000-4000-8000-900000000001";
const ROLE_ID          = "00000000-0000-4000-8000-900000000002";
const INVITEE_ID       = "00000000-0000-4000-8000-900000000003";
const INVITER_ID       = "00000000-0000-4000-8000-900000000004";
const INVITE_ID        = "00000000-0000-4000-8000-900000000005";
const SECOND_INVITE_ID = "00000000-0000-4000-8000-900000000006";
/* eslint-enable prettier/prettier */

const EXPIRATION_DATE = new Date("2026-01-01T00:00:00.000Z");

const helpers = new InviteUnitHelpers();

function createAccounts(): { invitee: Entities.Account; inviter: Entities.Account } {
    return {
        invitee: helpers.createAccount({ id: INVITEE_ID }),
        inviter: helpers.createAccount({ id: INVITER_ID }),
    };
}

describe("InviteService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the invitee is already a member of the realm", async () => {
            const { invitee, inviter } = createAccounts();
            const { service, repositories, transaction } = helpers.service();
            repositories.accounts.findUniqueOrThrow.mockImplementation(({ where }: { where: { id: string } }) => {
                return Promise.resolve(where.id === INVITEE_ID ? invitee : inviter);
            });
            repositories.memberships.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createMembership({ account: invitee, realm: REALM_ID })),
            );

            await expect(
                service.create({
                    input: { invitee: INVITEE_ID, inviter: INVITER_ID, realm: REALM_ID, role: ROLE_ID },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.invite.INVITEE_ALREADY_MEMBER");

            expect(repositories.memberships.findUnique).toHaveBeenCalledWith({
                where: { account: invitee, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates a pending invite for a non-member invitee", async () => {
            const { invitee, inviter } = createAccounts();
            const { service, repositories, transaction } = helpers.service();
            repositories.accounts.findUniqueOrThrow.mockImplementation(({ where }: { where: { id: string } }) => {
                return Promise.resolve(where.id === INVITEE_ID ? invitee : inviter);
            });

            const result = await service.create({
                input: { invitee: INVITEE_ID, inviter: INVITER_ID, realm: REALM_ID, role: ROLE_ID },
                transaction: transaction.entityManager,
            });

            expect(result).toEqual(
                expect.objectContaining({
                    status: InviteStatus.PENDING,
                    realm: REALM_ID,
                    role: ROLE_ID,
                    invitee,
                    inviter,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("accept", () => {
        it("returns the pending invite when the invitee has no membership yet", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, realm: REALM_ID });
            const { service, repositories, transaction } = helpers.service();
            repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(invite));

            const result = await service.accept({
                input: { invite: INVITE_ID, invitee: INVITEE_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.invites.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: INVITE_ID, invitee: INVITEE_ID },
                transaction: transaction.entityManager,
            });
            expect(repositories.memberships.findUnique).toHaveBeenCalledWith({
                where: { account: INVITEE_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(result).toBe(invite);
        });

        it("throws when the invitee is already a member of the realm", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, realm: REALM_ID });
            const { service, repositories, transaction } = helpers.service();
            repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(invite));
            repositories.memberships.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createMembership({ realm: REALM_ID })),
            );

            await expect(
                service.accept({
                    input: { invite: INVITE_ID, invitee: INVITEE_ID },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.invite.INVITEE_ALREADY_MEMBER");
        });

        it("throws when the invite is no longer active", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, status: InviteStatus.DECLINED });
            const { service, repositories, transaction } = helpers.service();
            repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(invite));

            await expect(
                service.accept({
                    input: { invite: INVITE_ID, invitee: INVITEE_ID },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("entities.invite.CANNOT_ACCEPT_INACTIVE");

            expect(repositories.memberships.findUnique).not.toHaveBeenCalled();
        });
    });

    describe("decline", () => {
        it("finds the invite of the invitee and declines it", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID });
            const { service, repositories, transaction } = helpers.service();
            const declineSpy = jest.spyOn(invite, "decline");
            repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(invite));

            const result = await service.decline({
                input: { invite: INVITE_ID, invitee: INVITEE_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.invites.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: INVITE_ID, invitee: INVITEE_ID },
                transaction: transaction.entityManager,
            });
            expect(declineSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe(invite);
        });
    });

    describe("cancel", () => {
        it("scopes the lookup to the inviter and cancels the invite", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID });
            const { service, repositories, transaction } = helpers.service();
            const cancelSpy = jest.spyOn(invite, "cancel");
            repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(invite));

            const result = await service.cancel({
                input: { invite: INVITE_ID, inviter: INVITER_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.invites.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: INVITE_ID, inviter: INVITER_ID },
                transaction: transaction.entityManager,
            });
            expect(cancelSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe(invite);
        });

        it("leaves an inactive invite untouched in the administrative branch", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, status: InviteStatus.DECLINED });
            const { service, repositories, transaction } = helpers.service();
            const cancelSpy = jest.spyOn(invite, "cancel");
            repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(invite));

            const result = await service.cancel({
                transaction: transaction.entityManager,
                input: { invite: INVITE_ID },
            });

            expect(repositories.invites.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { id: INVITE_ID },
            });
            expect(cancelSpy).not.toHaveBeenCalled();
            expect(result.status).toBe(InviteStatus.DECLINED);
        });
    });

    describe("invalidatePending", () => {
        it("invalidates pending invites where the account is either invitee or inviter", async () => {
            const received = helpers.createInvite({ id: INVITE_ID });
            const sent = helpers.createInvite({ id: SECOND_INVITE_ID });
            const { service, repositories, transaction } = helpers.service();
            const receivedSpy = jest.spyOn(received, "invalidate");
            const sentSpy = jest.spyOn(sent, "invalidate");
            repositories.invites.find.mockImplementation(() => Promise.resolve([received, sent]));

            const result = await service.invalidatePending({
                transaction: transaction.entityManager,
                input: { account: INVITEE_ID },
            });

            expect(repositories.invites.find).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: {
                    $or: [{ invitee: INVITEE_ID }, { inviter: INVITEE_ID }],
                    status: InviteStatus.PENDING,
                },
            });
            expect(receivedSpy).toHaveBeenCalledTimes(1);
            expect(sentSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([received, sent]);
        });
    });

    describe("expire", () => {
        it("expires pending invites older than the expiration date within the batch", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID });
            const { service, repositories, transaction } = helpers.service();
            const expireSpy = jest.spyOn(invite, "expire");
            repositories.invites.find.mockImplementation(() => Promise.resolve([invite]));

            const result = await service.expire({
                input: { expirationDate: EXPIRATION_DATE, batchSize: 25 },
                transaction: transaction.entityManager,
            });

            expect(repositories.invites.find).toHaveBeenCalledWith({
                where: { status: InviteStatus.PENDING, createdAt: { $lt: EXPIRATION_DATE } },
                transaction: transaction.entityManager,
                options: { limit: 25 },
            });
            expect(expireSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([invite]);
        });
    });
});
