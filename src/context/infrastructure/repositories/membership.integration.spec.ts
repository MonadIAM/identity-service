import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/fixtures/core.fixture";

import { MembershipRepository } from "./membership.repository";

describe("MembershipRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new MembershipRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted membership through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const invitedBy = randomUUID();
        const realm = randomUUID();
        const membership = await suite.fixtures().createMembership({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            invitedBy,
            account,
            realm,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { account, realm } });

        expect(loaded).toMatchObject({
            joinedAt: new Date("2026-01-01T00:00:00.000Z"),
            createdAt: membership.createdAt,
            invitedBy,
            realm,
        });
        expect(loaded.account.id).toBe(account.id);
    });
});
