import { describe, expect, it } from "@jest/globals";

import { IdentifierFixture } from "~testing/integration/repositories/identifier.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

import { IdentifierRepository } from "./identifier.repository";

describe("[Repository] - Identifier", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new IdentifierRepository(readManager),
        fixture: (entityManager) => new IdentifierFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted identifier through the schema", async () => {
            // Arrange
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

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: identifier.id } });

            // Assert
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
    });

    describe("[Method] - getLookupList", () => {
        it("[case] - returns lookup rows scoped to account", async () => {
            // Arrange
            const { account, matched, otherAccount } = await suite.fixtures().lookupScenario();

            // Act
            const [identifiers, total] = await suite.repository().getLookupList({
                account: account.id,
                term: "nora.primary@example.test",
                pagination: { currentPage: 1, elementsPerPage: 10 },
            });
            const result = identifiers.map(({ id }) => id);
            const result1 = identifiers.map(({ id }) => id);

            // Assert
            expect(total).toBe(1);
            expect(result).toEqual([matched.id]);
            expect(result1).not.toContain(otherAccount.id);
        });

        it("[case] - returns lookup page scoped to account and ordered by identity when term is empty", async () => {
            // Arrange
            const { account, alpha, bravo, charlie, otherAccount } = await suite.fixtures().orderedLookupScenario();

            // Act
            const [identifiers, total] = await suite.repository().getLookupList({
                account: account.id,
                term: "",
                pagination: { currentPage: 1, elementsPerPage: 2 },
            });
            const result = identifiers.map(({ id }) => id);
            const result1 = identifiers.map(({ id }) => id);
            const result2 = identifiers.map(({ id }) => id);

            // Assert
            expect(total).toBe(3);
            expect(result).toEqual([alpha.id, bravo.id]);
            expect(result1).not.toContain(charlie.id);
            expect(result2).not.toContain(otherAccount.id);
        });

        it("[case] - returns lookup rows matched by owner profile display name", async () => {
            // Arrange
            const { account, matched, otherAccount } = await suite.fixtures().profileLookupScenario();

            // Act
            const [identifiers, total] = await suite.repository().getLookupList({
                account: account.id,
                term: "Mina Profile",
                pagination: { currentPage: 1, elementsPerPage: 10 },
            });
            const result = identifiers.map(({ id }) => id);
            const result1 = identifiers.map(({ id }) => id);

            // Assert
            expect(total).toBe(1);
            expect(result).toEqual([matched.id]);
            expect(result1).not.toContain(otherAccount.id);
        });

        it("[case] - uses trigram lookup with stable identity tie-breakers", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupSearchScenario();

            // Act
            const [identifiers] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                account: scenario.account.id,
                term: scenario.term,
            });
            const result = identifiers.map(({ id }) => id);

            // Assert
            expect(result).toEqual(scenario.expectedOrderedIDs);
        });
    });

    describe("[Method] - isLastVerifiedIdentifier", () => {
        it("[case] - detects the last verified identifier for account", async () => {
            // Arrange
            const { account, first, second, solo, soloAccount, unverified } = await suite.fixtures().verificationScenario();

            // Act
            const result = await suite.repository().isLastVerifiedIdentifier({
                identifier: first.id,
                account: account.id,
            });
            const result1 = await suite.repository().isLastVerifiedIdentifier({
                identifier: second.id,
                account: account.id,
            });
            const result2 = await suite.repository().isLastVerifiedIdentifier({
                identifier: unverified.id,
                account: account.id,
            });
            const result3 = await suite.repository().isLastVerifiedIdentifier({
                account: soloAccount.id,
                identifier: solo.id,
            });

            // Assert
            expect(result).toBe(false);
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(true);
        });
    });
});
