import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { MembershipUnitHelpers } from "~testing/unit/domain-service/membership.helpers";
import { InviteStatus } from "~context/enums";

/* eslint-disable prettier/prettier */
const REALM_ID   = "00000000-0000-4000-8000-a00000000001";
const ROLE_ID    = "00000000-0000-4000-8000-a00000000002";
const ACCOUNT_ID = "00000000-0000-4000-8000-a00000000003";
const ACTOR_ID   = "00000000-0000-4000-8000-a00000000004";
const INVITE_ID  = "00000000-0000-4000-8000-a00000000005";
/* eslint-enable prettier/prettier */

const JOINED_AT = Date.parse("2026-01-01T00:00:00.000Z");

const helpers = new MembershipUnitHelpers();

function createContext(
    props: { invite?: Entities.Invite; account?: Entities.Account } = {},
): Unit.Domain.Membership.Service.Result & { readonly account: Entities.Account } {
    const account = props.account ?? helpers.createAccount({ id: ACCOUNT_ID });
    const context = helpers.service({ account });

    if (props.invite) {
        context.repositories.invites.findUniqueOrThrow.mockImplementation(() => Promise.resolve(props.invite));
    }

    return { ...context, account };
}

function confirmByInvite(transaction: ORM.EntityManager): Services.Membership.Confirm.Props {
    return {
        input: { account: ACCOUNT_ID, invite: INVITE_ID, role: ROLE_ID, joinedAt: JOINED_AT },
        actor: ACTOR_ID,
        realm: REALM_ID,
        transaction,
    };
}

describe("MembershipService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("confirm", () => {
        it("persists a membership, opens history and accepts a pending invite", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, realm: REALM_ID });
            const { service, repositories, services, transaction, account } = createContext({ invite });
            const acceptSpy = jest.spyOn(invite, "accept");

            await service.confirm(confirmByInvite(transaction.entityManager));

            expect(repositories.invites.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: INVITE_ID, invitee: ACCOUNT_ID, realm: REALM_ID, role: ROLE_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.persist).toHaveBeenCalledWith(
                expect.objectContaining({
                    joinedAt: new Date(JOINED_AT),
                    invitedBy: ACTOR_ID,
                    realm: REALM_ID,
                    account,
                }),
            );
            expect(services.membershipHistoryService.create).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                input: {
                    joinedAt: new Date(JOINED_AT),
                    account: account.id,
                    invitedBy: ACTOR_ID,
                    realm: REALM_ID,
                },
            });
            expect(acceptSpy).toHaveBeenCalledTimes(1);
        });

        it("does not re-accept an already accepted invite but still records history", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, realm: REALM_ID, status: InviteStatus.ACCEPTED });
            const { service, services, transaction } = createContext({ invite });
            const acceptSpy = jest.spyOn(invite, "accept");

            await service.confirm(confirmByInvite(transaction.entityManager));

            expect(services.membershipHistoryService.create).toHaveBeenCalledTimes(1);
            expect(acceptSpy).not.toHaveBeenCalled();
        });

        it("skips membership creation when the account is already a member but still records history", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, realm: REALM_ID });
            const { service, repositories, services, transaction } = createContext({ invite });
            repositories.memberships.findUnique.mockImplementation(() =>
                Promise.resolve(helpers.createMembership({ realm: REALM_ID })),
            );

            await service.confirm(confirmByInvite(transaction.entityManager));

            expect(transaction.persist).not.toHaveBeenCalled();
            expect(services.membershipHistoryService.create).toHaveBeenCalledTimes(1);
        });

        it("leaves an inactive invite without membership, history or transition", async () => {
            const invite = helpers.createInvite({ id: INVITE_ID, realm: REALM_ID, status: InviteStatus.CANCELLED });
            const { service, services, transaction } = createContext({ invite });

            await service.confirm(confirmByInvite(transaction.entityManager));

            expect(transaction.persist).not.toHaveBeenCalled();
            expect(services.membershipHistoryService.create).not.toHaveBeenCalled();
        });

        it("closes history and removes the membership in the exclude branch", async () => {
            const membership = helpers.createMembership({ realm: REALM_ID });
            const { service, repositories, services, transaction } = createContext();
            repositories.memberships.findUnique.mockImplementation(() => Promise.resolve(membership));

            await service.confirm({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
                actor: ACTOR_ID,
                realm: REALM_ID,
            });

            expect(services.membershipHistoryService.close).toHaveBeenCalledWith({
                input: { account: ACCOUNT_ID, realm: REALM_ID, excludedBy: ACTOR_ID },
                transaction: transaction.entityManager,
            });
            expect(transaction.remove).toHaveBeenCalledWith(membership);
        });

        it("closes history without removing anything when there is no membership left", async () => {
            const { service, services, transaction } = createContext();

            await service.confirm({
                transaction: transaction.entityManager,
                input: { account: ACCOUNT_ID },
                actor: ACTOR_ID,
                realm: REALM_ID,
            });

            expect(services.membershipHistoryService.close).toHaveBeenCalledTimes(1);
            expect(transaction.remove).not.toHaveBeenCalled();
        });
    });

    describe("exclude", () => {
        it("returns the membership of the account in the realm", async () => {
            const membership = helpers.createMembership({ realm: REALM_ID });
            const { service, repositories, transaction } = createContext();
            repositories.memberships.findUnique.mockImplementation(() => Promise.resolve(membership));

            const result = await service.exclude({
                input: { account: ACCOUNT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });

            expect(repositories.memberships.findUnique).toHaveBeenCalledWith({
                where: { account: ACCOUNT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(result).toBe(membership);
        });

        it("throws when the account has no membership in the realm", async () => {
            const { service, transaction } = createContext();

            await expect(
                service.exclude({
                    input: { account: ACCOUNT_ID, realm: REALM_ID },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.membership.MEMBERSHIP_NOT_FOUND");
        });
    });
});
