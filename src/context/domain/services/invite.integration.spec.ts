import { describe, expect, it } from "@jest/globals";

import { InviteIntegrationHelpers } from "~testing/integration/domain-service/invite.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { Invite } from "~context/domain/entities";
import { InviteStatus } from "~context/enums";

const REALM_ID = "00000000-0000-4000-8000-000000000051";
const ROLE_ID = "00000000-0000-4000-8000-000000000052";
const helpers = new InviteIntegrationHelpers();

async function loadInvites(suite: Integration.Domain.Invite.Suite, account: Entities.Account): Promise<Entities.Invite[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            Invite,
            {
                $or: [{ invitee: account.id }, { inviter: account.id }],
            },
            {
                orderBy: { createdAt: "asc" },
            },
        ),
    );
}

describe("InviteService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("blocks duplicate pending invites and keeps the first invite persisted", async () => {
        const inviter = await suite.fixtures().createAccount();
        const invitee = await suite.fixtures().createAccount();

        await suite.transaction((transaction) =>
            suite.repository().inviteService.create({
                input: {
                    inviter: inviter.id,
                    invitee: invitee.id,
                    realm: REALM_ID,
                    role: ROLE_ID,
                },
                transaction,
            }),
        );

        await expect(
            suite.transaction((transaction) =>
                suite.repository().inviteService.create({
                    input: {
                        inviter: inviter.id,
                        invitee: invitee.id,
                        realm: REALM_ID,
                        role: ROLE_ID,
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("invite_realm_invitee_pending_unique");

        const invites = await loadInvites(suite, invitee);

        expect(invites).toHaveLength(1);
        expect(invites[0]?.status).toBe(InviteStatus.PENDING);
    });

    it("rejects creating and accepting invites for existing members", async () => {
        const inviter = await suite.fixtures().createAccount();
        const invitee = await suite.fixtures().createAccount();
        await suite.fixtures().createMembership({
            account: invitee,
            realm: REALM_ID,
        });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().inviteService.create({
                    input: {
                        inviter: inviter.id,
                        invitee: invitee.id,
                        realm: REALM_ID,
                        role: ROLE_ID,
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.invite.INVITEE_ALREADY_MEMBER");

        const invite = await suite.fixtures().createInvite({
            realm: "00000000-0000-4000-8000-000000000053",
            role: ROLE_ID,
            invitee,
            inviter,
        });
        await suite.fixtures().createMembership({
            realm: invite.realm,
            account: invitee,
        });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().inviteService.accept({
                    input: {
                        invitee: invitee.id,
                        invite: invite.id,
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.invite.INVITEE_ALREADY_MEMBER");
    });

    it("declines an invite for its invitee", async () => {
        const invitee = await suite.fixtures().createAccount();
        const inviter = await suite.fixtures().createAccount();
        const invite = await suite.fixtures().createInvite({ invitee, inviter, realm: REALM_ID });

        await suite.transaction((transaction) =>
            suite.repository().inviteService.decline({
                input: {
                    invitee: invitee.id,
                    invite: invite.id,
                },
                transaction,
            }),
        );

        const invites = await loadInvites(suite, invitee);

        expect(invites.find(({ id }) => id === invite.id)?.status).toBe(InviteStatus.DECLINED);
    });

    it("cancels an invite for its inviter", async () => {
        const invitee = await suite.fixtures().createAccount();
        const inviter = await suite.fixtures().createAccount();
        const invite = await suite.fixtures().createInvite({ invitee, inviter, realm: REALM_ID });

        await suite.transaction((transaction) =>
            suite.repository().inviteService.cancel({
                input: {
                    inviter: inviter.id,
                    invite: invite.id,
                },
                transaction,
            }),
        );

        const invites = await loadInvites(suite, invitee);

        expect(invites.find(({ id }) => id === invite.id)?.status).toBe(InviteStatus.CANCELLED);
    });

    it("invalidates pending invites received and sent by an account", async () => {
        const owner = await suite.fixtures().createAccount();
        const inviter = await suite.fixtures().createAccount();
        const other = await suite.fixtures().createAccount();
        const received = await suite.fixtures().createInvite({
            realm: "00000000-0000-4000-8000-000000000055",
            invitee: owner,
            inviter: other,
        });
        const sent = await suite.fixtures().createInvite({
            realm: "00000000-0000-4000-8000-000000000056",
            invitee: other,
            inviter: owner,
        });
        const untouched = await suite.fixtures().createInvite({
            realm: "00000000-0000-4000-8000-000000000057",
            invitee: other,
            inviter,
        });

        await suite.transaction((transaction) =>
            suite.repository().inviteService.invalidatePending({
                input: {
                    account: owner.id,
                },
                transaction,
            }),
        );

        const ownerInvites = await loadInvites(suite, owner);
        const otherInvites = await loadInvites(suite, other);

        expect(ownerInvites.find(({ id }) => id === received.id)?.status).toBe(InviteStatus.INVALIDATED);
        expect(ownerInvites.find(({ id }) => id === sent.id)?.status).toBe(InviteStatus.INVALIDATED);
        expect(otherInvites.find(({ id }) => id === untouched.id)?.status).toBe(InviteStatus.PENDING);
    });

    it("expires only old pending invites by batch size", async () => {
        const invitee = await suite.fixtures().createAccount();
        const inviter = await suite.fixtures().createAccount();
        const expiring = await suite.fixtures().createInvite({
            realm: "00000000-0000-4000-8000-000000000057",
            invitee,
            inviter,
        });
        const fresh = await suite.fixtures().createInvite({
            realm: "00000000-0000-4000-8000-000000000058",
            invitee,
            inviter,
        });

        await suite.transaction(async (transaction) => {
            const entity = await transaction.findOneOrFail(Invite, { id: expiring.id });
            entity.createdAt = new Date("2025-01-01T00:00:00.000Z");
            await transaction.flush();
        });
        await suite.transaction((transaction) =>
            suite.repository().inviteService.expire({
                input: {
                    expirationDate: new Date("2026-01-01T00:00:00.000Z"),
                    batchSize: 1,
                },
                transaction,
            }),
        );

        const invites = await loadInvites(suite, invitee);

        expect(invites.find(({ id }) => id === expiring.id)?.status).toBe(InviteStatus.EXPIRED);
        expect(invites.find(({ id }) => id === fresh.id)?.status).toBe(InviteStatus.PENDING);
    });
});
