import { describe, expect, it } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/core";

import { MembershipIntegrationHelpers } from "~testing/integration/domain-service/membership.helpers";
import { Invite, Membership, MembershipHistory } from "~context/domain/entities";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ActionType, EntityType, InviteStatus } from "~context/enums";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { ChangeLog } from "~common/transaction-manager/entities";

const ACTOR_ID = "00000000-0000-4000-8000-000000000021";
const REALM_ID = "00000000-0000-4000-8000-000000000022";
const ROLE_ID = "00000000-0000-4000-8000-000000000023";
const helpers = new MembershipIntegrationHelpers();

async function loadMemberships(
    suite: Integration.Domain.Membership.Suite,
    account: Entities.Account,
): Promise<Entities.Membership[]> {
    return await suite.transaction((transaction) => transaction.find(Membership, { account: account.id }));
}

async function loadMembershipHistories(
    suite: Integration.Domain.Membership.Suite,
    account: Entities.Account,
): Promise<Entities.MembershipHistory[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            MembershipHistory,
            {
                account: account.id,
                realm: REALM_ID,
            },
            {
                orderBy: { joinedAt: "asc" },
            },
        ),
    );
}

async function loadInvites(
    suite: Integration.Domain.Membership.Suite,
    account: Entities.Account,
): Promise<Entities.Invite[]> {
    return await suite.transaction((transaction) =>
        transaction.find(Invite, { invitee: account.id }, { orderBy: { createdAt: "asc" } }),
    );
}

async function loadChangeLogs(suite: Integration.Domain.Membership.Suite): Promise<SystemEntities.ChangeLog[]> {
    return await suite.transaction((transaction) =>
        transaction.find(ChangeLog, {}, { orderBy: [{ entityType: "asc" }, { createdAt: "asc" }] }),
    );
}

describe("MembershipService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("confirms an invite with membership, history and composite-key change log", async () => {
        const inviter = await suite.fixtures().createAccount();
        const invitee = await suite.fixtures().createAccount();
        const invite = await suite.fixtures().createInvite({
            realm: REALM_ID,
            role: ROLE_ID,
            invitee,
            inviter,
        });

        await suite.repository().transactionalService.run({
            audit: {
                context: {
                    ip: "127.0.0.1",
                    userAgent: "membership-integration",
                },
                actionType: ActionType.ACCEPT,
                entityType: EntityType.MEMBERSHIP,
                actor: ACTOR_ID,
                realm: REALM_ID,
            },
            changeLog: true,
            resource: "Membership",
            execute: async (transaction) => {
                await suite.repository().membershipService.confirm({
                    input: {
                        joinedAt: Date.parse("2026-01-01T00:00:00.000Z"),
                        account: invitee.id,
                        invite: invite.id,
                        role: ROLE_ID,
                    },
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    transaction,
                });
            },
        });

        const memberships = await loadMemberships(suite, invitee);
        const histories = await loadMembershipHistories(suite, invitee);
        const invites = await loadInvites(suite, invitee);
        const changeLogs = await loadChangeLogs(suite);

        expect(memberships).toHaveLength(1);
        expect(histories).toHaveLength(1);
        expect(invites.find(({ id }) => id === invite.id)?.status).toBe(InviteStatus.ACCEPTED);
        expect(changeLogs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    changeType: ChangeSetType.CREATE,
                    entityType: "Membership",
                }),
            ]),
        );
    });

    it("excludes a member by closing history, removing membership and logging composite-key deletion", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createMembership({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            invitedBy: ACTOR_ID,
            realm: REALM_ID,
            account,
        });
        await suite.fixtures().createMembershipHistory({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            invitedBy: ACTOR_ID,
            account: account.id,
            realm: REALM_ID,
        });

        await suite.repository().transactionalService.run({
            audit: {
                context: {
                    ip: "127.0.0.1",
                    userAgent: "membership-integration",
                },
                actionType: ActionType.EXCLUDE,
                entityType: EntityType.MEMBERSHIP,
                actor: ACTOR_ID,
                realm: REALM_ID,
            },
            changeLog: true,
            resource: "Membership",
            execute: async (transaction) => {
                await suite.repository().membershipService.exclude({
                    input: {
                        account: account.id,
                        realm: REALM_ID,
                    },
                    transaction,
                });
                await suite.repository().membershipService.confirm({
                    input: {
                        account: account.id,
                    },
                    actor: ACTOR_ID,
                    realm: REALM_ID,
                    transaction,
                });
            },
        });

        const memberships = await loadMemberships(suite, account);
        const histories = await loadMembershipHistories(suite, account);
        const changeLogs = await loadChangeLogs(suite);

        expect(memberships).toHaveLength(0);
        expect(histories[0]?.leaveAt).toBeInstanceOf(Date);
        expect(histories[0]?.excludedBy).toBe(ACTOR_ID);
        expect(changeLogs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    changeType: ChangeSetType.DELETE,
                    entityType: "Membership",
                }),
                expect.objectContaining({
                    changeType: ChangeSetType.UPDATE,
                    entityType: "MembershipHistory",
                }),
            ]),
        );
    });
});
