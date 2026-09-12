import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MembershipHistoryFixture } from "~testing/fixtures/membership-history.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

import { MembershipHistoryRepository } from "./membership-history.repository";

describe("MembershipHistoryRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new MembershipHistoryRepository(readManager),
        fixture: (entityManager) => new MembershipHistoryFixture(entityManager),
    });

    it("maps the persisted membership history through the schema", async () => {
        const history = await suite.fixtures().createMembershipHistory({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            leaveAt: new Date("2026-06-01T00:00:00.000Z"),
            excludedBy: randomUUID(),
            invitedBy: randomUUID(),
            account: randomUUID(),
            realm: randomUUID(),
        });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: history.id } })).resolves.toMatchObject({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            leaveAt: new Date("2026-06-01T00:00:00.000Z"),
            excludedBy: history.excludedBy,
            createdAt: history.createdAt,
            invitedBy: history.invitedBy,
            account: history.account,
            realm: history.realm,
            id: history.id,
        });
    });

    it("rejects a second open period for the same account and realm", async () => {
        const { account, realm } = await suite.fixtures().openPeriodScenario();

        await expect(suite.fixtures().createMembershipHistory({ account, realm })).rejects.toBeInstanceOf(
            UniqueConstraintViolationException,
        );
    });

    it("opens a new period once the previous one is closed", async () => {
        const { account, realm } = await suite.fixtures().closedPeriodScenario();

        const reopened = await suite.fixtures().createMembershipHistory({ account, realm });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: reopened.id } })).resolves.toMatchObject({
            id: reopened.id,
            realm,
        });
    });
});
