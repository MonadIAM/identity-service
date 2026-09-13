import { describe, expect, it } from "@jest/globals";

import { MembershipHistoryIntegrationHelpers } from "~testing/integration/domain-service/membership-history.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { MembershipHistory } from "~context/domain/entities";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000061";
const REALM_ID = "00000000-0000-4000-8000-000000000062";
const ACTOR_ID = "00000000-0000-4000-8000-000000000063";

const helpers = new MembershipHistoryIntegrationHelpers();

async function loadHistories(suite: Integration.Domain.MembershipHistory.Suite): Promise<Entities.MembershipHistory[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            MembershipHistory,
            {
                account: ACCOUNT_ID,
                realm: REALM_ID,
            },
            {
                orderBy: { joinedAt: "asc" },
            },
        ),
    );
}

describe("MembershipHistoryService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates only one open history period for account and realm", async () => {
        await suite.transaction((transaction) =>
            suite.repository().membershipHistoryService.create({
                input: {
                    joinedAt: new Date("2026-01-01T00:00:00.000Z"),
                    invitedBy: ACTOR_ID,
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                },
                transaction,
            }),
        );
        await suite.transaction((transaction) =>
            suite.repository().membershipHistoryService.create({
                input: {
                    joinedAt: new Date("2026-01-02T00:00:00.000Z"),
                    invitedBy: ACTOR_ID,
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                },
                transaction,
            }),
        );

        const histories = await loadHistories(suite);

        expect(histories).toHaveLength(1);
        expect(histories[0]?.joinedAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    });

    it("closes only the open membership history period", async () => {
        await suite.fixtures().createMembershipHistory({
            joinedAt: new Date("2025-01-01T00:00:00.000Z"),
            leaveAt: new Date("2025-02-01T00:00:00.000Z"),
            excludedBy: ACTOR_ID,
            account: ACCOUNT_ID,
            realm: REALM_ID,
        });
        await suite.fixtures().createMembershipHistory({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            invitedBy: ACTOR_ID,
            account: ACCOUNT_ID,
            realm: REALM_ID,
        });

        await suite.transaction((transaction) =>
            suite.repository().membershipHistoryService.close({
                input: {
                    excludedBy: "00000000-0000-4000-8000-000000000064",
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                },
                transaction,
            }),
        );

        const histories = await loadHistories(suite);

        expect(histories).toHaveLength(2);
        expect(histories[0]?.leaveAt).toEqual(new Date("2025-02-01T00:00:00.000Z"));
        expect(histories[1]?.leaveAt).toBeInstanceOf(Date);
        expect(histories[1]?.excludedBy).toBe("00000000-0000-4000-8000-000000000064");
    });

    it("creates a new open history period after the previous one is closed", async () => {
        await suite.fixtures().createMembershipHistory({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            leaveAt: new Date("2026-02-01T00:00:00.000Z"),
            excludedBy: ACTOR_ID,
            account: ACCOUNT_ID,
            realm: REALM_ID,
        });

        await suite.transaction((transaction) =>
            suite.repository().membershipHistoryService.create({
                input: {
                    joinedAt: new Date("2026-03-01T00:00:00.000Z"),
                    invitedBy: "00000000-0000-4000-8000-000000000065",
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                },
                transaction,
            }),
        );

        const histories = await loadHistories(suite);

        expect(histories).toHaveLength(2);
        expect(histories[1]).toMatchObject({
            invitedBy: "00000000-0000-4000-8000-000000000065",
            leaveAt: null,
        });
    });
});
