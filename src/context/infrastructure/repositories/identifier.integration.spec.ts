import { describe, expect, it } from "@jest/globals";

import { IdentifierFixture } from "~testing/integration/repositories/identifier.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

import { IdentifierRepository } from "./identifier.repository";

describe("IdentifierRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new IdentifierRepository(readManager),
        fixture: (entityManager) => new IdentifierFixture(entityManager),
    });

    it("maps the persisted identifier through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const identifier = await suite.fixtures().createIdentifier({
            lastUsedAt: new Date("2026-02-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            identity: "mapping@example.test",
            providerUserId: "provider-user",
            provider: "mapping-provider",
            isPublicContact: true,
            isVerified: true,
            account,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: identifier.id } });

        expect(loaded).toMatchObject({
            lastUsedAt: new Date("2026-02-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            verifiedAt: identifier.verifiedAt,
            identity: "mapping@example.test",
            providerUserId: "provider-user",
            provider: "mapping-provider",
            type: identifier.type,
            isPublicContact: true,
            id: identifier.id,
            isVerified: true,
        });
        expect(loaded.account.id).toBe(account.id);
    });

    it("returns lookup rows scoped to account", async () => {
        const { account, matched, otherAccount } = await suite.fixtures().lookupScenario();

        const [identifiers, total] = await suite.repository().getLookupList({
            account: account.id,
            term: "nora.primary@example.test",
            pagination: { currentPage: 1, elementsPerPage: 10 },
        });

        expect(total).toBe(1);
        expect(identifiers.map(({ id }) => id)).toEqual([matched.id]);
        expect(identifiers.map(({ id }) => id)).not.toContain(otherAccount.id);
    });

    it("returns lookup page scoped to account and ordered by identity when term is empty", async () => {
        const { account, alpha, bravo, charlie, otherAccount } = await suite.fixtures().orderedLookupScenario();

        const [identifiers, total] = await suite.repository().getLookupList({
            account: account.id,
            term: "",
            pagination: { currentPage: 1, elementsPerPage: 2 },
        });

        expect(total).toBe(3);
        expect(identifiers.map(({ id }) => id)).toEqual([alpha.id, bravo.id]);
        expect(identifiers.map(({ id }) => id)).not.toContain(charlie.id);
        expect(identifiers.map(({ id }) => id)).not.toContain(otherAccount.id);
    });

    it("returns lookup rows matched by owner profile display name", async () => {
        const { account, matched, otherAccount } = await suite.fixtures().profileLookupScenario();

        const [identifiers, total] = await suite.repository().getLookupList({
            account: account.id,
            term: "Mina Profile",
            pagination: { currentPage: 1, elementsPerPage: 10 },
        });

        expect(total).toBe(1);
        expect(identifiers.map(({ id }) => id)).toEqual([matched.id]);
        expect(identifiers.map(({ id }) => id)).not.toContain(otherAccount.id);
    });

    it("uses trigram lookup with stable identity tie-breakers", async () => {
        const scenario = await suite.fixtures().lookupSearchScenario();

        const [identifiers] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 10 },
            account: scenario.account.id,
            term: scenario.term,
        });

        expect(identifiers.map(({ id }) => id)).toEqual(scenario.expectedOrderedIDs);
    });

    it("detects the last verified identifier for account", async () => {
        const { account, first, second, solo, soloAccount, unverified } = await suite.fixtures().verificationScenario();

        await expect(
            suite.repository().isLastVerifiedIdentifier({
                identifier: first.id,
                account: account.id,
            }),
        ).resolves.toBe(false);
        await expect(
            suite.repository().isLastVerifiedIdentifier({
                identifier: second.id,
                account: account.id,
            }),
        ).resolves.toBe(false);
        await expect(
            suite.repository().isLastVerifiedIdentifier({
                identifier: unverified.id,
                account: account.id,
            }),
        ).resolves.toBe(false);
        await expect(
            suite.repository().isLastVerifiedIdentifier({
                account: soloAccount.id,
                identifier: solo.id,
            }),
        ).resolves.toBe(true);
    });
});
