import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { InviteFixture } from "~testing/fixtures/invite.fixture";

import { InviteRepository } from "./invite.repository";

describe("InviteRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new InviteRepository(readManager),
        fixture: (entityManager) => new InviteFixture(entityManager),
    });

    it("maps the persisted invite through the schema", async () => {
        const inviter = await suite.fixtures().createAccount();
        const invitee = await suite.fixtures().createAccount();
        const realm = randomUUID();
        const role = randomUUID();
        const invite = await suite.fixtures().createInvite({ invitee, inviter, realm, role });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: invite.id } });

        expect(loaded).toMatchObject({
            createdAt: invite.createdAt,
            version: invite.version,
            status: invite.status,
            id: invite.id,
            realm,
            role,
        });
        expect(loaded.invitee.id).toBe(invitee.id);
        expect(loaded.inviter.id).toBe(inviter.id);
    });

    it("rejects a second pending invite for the same realm and invitee", async () => {
        const { inviter, invitee, realm } = await suite.fixtures().pendingScenario();

        await expect(suite.fixtures().createInvite({ inviter, invitee, realm })).rejects.toBeInstanceOf(
            UniqueConstraintViolationException,
        );
    });

    it("accepts a new invite once the previous one leaves the pending state", async () => {
        const { inviter, invitee, realm } = await suite.fixtures().cancelledScenario();

        const reissued = await suite.fixtures().createInvite({ inviter, invitee, realm });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: reissued.id } })).resolves.toMatchObject({
            id: reissued.id,
            realm,
        });
    });
});
