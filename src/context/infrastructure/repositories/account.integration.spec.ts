import { describe, expect, it } from "@jest/globals";

import { AccountFixture } from "~testing/integration/repositories/account.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { AccountStatus, AccountSubject } from "~context/enums";
import {
    RecoveryCode,
    SecondFactor,
    Identifier,
    MasterCode,
    Password,
    Profile,
    Session,
    Account,
} from "~context/domain/entities";

import { AccountRepository } from "./account.repository";

describe("[Repository] - Account", () => {
    const suite = postgresSuite({
        repository: ({ readManager, writeManager }) => new AccountRepository(readManager, writeManager),
        fixture: (entityManager) => new AccountFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted account through the schema", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount({
                lastActiveAt: new Date("2026-02-01T00:00:00.000Z"),
                updatedAt: new Date("2026-03-01T00:00:00.000Z"),
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                subject: AccountSubject.SERVICE,
                status: AccountStatus.SUSPENDED,
                is2FAEnforced: true,
            });

            // Act
            const result = await suite.repository().findUniqueOrThrow({ where: { id: account.id } });

            // Assert
            expect(result).toMatchObject({
                lastActiveAt: new Date("2026-02-01T00:00:00.000Z"),
                updatedAt: new Date("2026-03-01T00:00:00.000Z"),
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                subject: AccountSubject.SERVICE,
                status: AccountStatus.SUSPENDED,
                version: account.version,
                is2FAEnforced: true,
                id: account.id,
            });
        });
    });

    describe("[Method] - getLookupList", () => {
        it.each([
            {
                match: "identifier",
                fixture: "lookupScenario",
                term: "ada.lovelace@example.test",
                identifier: "ada.lovelace@example.test",
                displayName: "Ada Lovelace",
            },
            {
                match: "display name",
                fixture: "displayNameLookupScenario",
                term: "Katherine Johnson",
                displayName: "Katherine Johnson",
                identifier: null,
            },
        ] as const)(
            "[case] - returns account lookup rows matched by $match trigram",
            async ({ fixture, term, identifier, displayName }) => {
                // Arrange
                const { matched } = await suite.fixtures()[fixture]();

                // Act
                const [rows, total] = await suite.repository().getLookupList({
                    term,
                    pagination: { currentPage: 1, elementsPerPage: 10 },
                });

                // Assert
                expect(total).toBe(1);
                expect(rows).toEqual([{ identifier, displayName, status: matched.status, id: matched.id }]);
            },
        );

        it("[case] - uses trigram lookup with stable display name tie-breakers", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupSearchScenario();

            // Act
            const [rows] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                term: scenario.term,
            });
            const result = rows.map(({ id }) => id);

            // Assert
            expect(result).toEqual(scenario.expectedOrderedIDs);
        });

        it("[case] - returns account lookup page ordered by display name when term is empty", async () => {
            // Arrange
            const { alpha, bravo, charlie } = await suite.fixtures().orderedLookupScenario();

            // Act
            const [rows, total] = await suite.repository().getLookupList({
                term: "",
                pagination: { currentPage: 1, elementsPerPage: 2 },
            });
            const result = rows.map(({ id }) => id);
            const result1 = rows.map(({ id }) => id);

            // Assert
            expect(total).toBe(3);
            expect(result).toEqual([alpha.id, bravo.id]);
            expect(result1).not.toContain(charlie.id);
        });

        it("[case] - returns the second account lookup page without gaps or repeats", async () => {
            // Arrange
            const { alpha, bravo, charlie } = await suite.fixtures().orderedLookupScenario();

            // Act
            const [firstPage, total] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                term: "",
            });
            const [secondPage] = await suite.repository().getLookupList({
                pagination: { currentPage: 2, elementsPerPage: 2 },
                term: "",
            });
            const result = [...firstPage, ...secondPage].map(({ id }) => id);

            // Assert
            expect(total).toBe(3);
            expect(result).toEqual([alpha.id, bravo.id, charlie.id]);
        });

        it("[case] - keeps accounts without a profile in the lookup output", async () => {
            // Arrange
            const { anonymous, named } = await suite.fixtures().profilelessLookupScenario();

            // Act
            const [rows, total] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                term: "",
            });
            const result = rows.map(({ id }) => id);
            const result1 = rows.map(({ displayName }) => displayName);

            // Assert
            expect(total).toBe(2);
            expect(result).toEqual([named.id, anonymous.id]);
            expect(result1).toEqual(["Named Account", null]);
        });
    });

    describe("[Method] - findExpiredPending", () => {
        it("[case] - finds expired pending accounts by creation time", async () => {
            // Arrange
            const { oldPending, recentPending } = await suite.fixtures().expirationScenario();

            // Act
            const accounts = await suite.repository().findExpiredPending({
                expirationDate: new Date("2025-06-01T00:00:00.000Z"),
                batchSize: 10,
            });
            const result = accounts.map(({ id }) => id);
            const result1 = accounts.map(({ id }) => id);

            // Assert
            expect(result).toContain(oldPending.id);
            expect(result1).not.toContain(recentPending.id);
        });
    });

    describe("[Method] - findExpiredInactive", () => {
        it("[case] - finds expired inactive accounts by activity watermark", async () => {
            // Arrange
            const { oldActive, recentActive, touchedActive, updatedActive } = await suite.fixtures().expirationScenario();

            // Act
            const accounts = await suite.repository().findExpiredInactive({
                expirationDate: new Date("2025-06-01T00:00:00.000Z"),
                batchSize: 1,
            });
            const result = accounts.map(({ id }) => id);
            const result1 = accounts.map(({ id }) => id);
            const result2 = accounts.map(({ id }) => id);
            const result3 = accounts.map(({ id }) => id);

            // Assert
            expect(accounts).toHaveLength(1);
            expect(result).toContain(oldActive.id);
            expect(result1).not.toContain(recentActive.id);
            expect(result2).not.toContain(touchedActive.id);
            expect(result3).not.toContain(updatedActive.id);
        });

        it("[case] - prefers the activity watermark over update and creation timestamps", async () => {
            // Arrange
            const { activeByActivity, staleByActivity } = await suite.fixtures().activityWatermarkScenario();

            // Act
            const accounts = await suite.repository().findExpiredInactive({
                expirationDate: new Date("2025-06-01T00:00:00.000Z"),
                batchSize: 10,
            });
            const result = accounts.map(({ id }) => id);
            const result1 = accounts.map(({ id }) => id);

            // Assert
            expect(result).toEqual([staleByActivity.id]);
            expect(result1).not.toContain(activeByActivity.id);
        });
    });

    describe("[Behavior] - account expiration", () => {
        it("[case] - keeps the expiration comparison strict at the boundary", async () => {
            // Arrange
            const scenario = await suite.fixtures().expirationBoundaryScenario();

            // Act
            const pending = await suite.repository().findExpiredPending({
                expirationDate: scenario.expirationDate,
                batchSize: 10,
            });
            const inactive = await suite.repository().findExpiredInactive({
                expirationDate: scenario.expirationDate,
                batchSize: 10,
            });
            const result = pending.map(({ id }) => id);
            const result1 = inactive.map(({ id }) => id);

            // Assert
            expect(result).toEqual([scenario.expiredPending.id]);
            expect(result1).toEqual([scenario.expiredActive.id]);
        });
    });

    describe("[Behavior] - deletion cascades", () => {
        it("[case] - cascades account deletion to its own credentials only", async () => {
            // Arrange
            const { kept, removed } = await suite.fixtures().cascadeScenario();

            // Act
            const counts = await suite.transaction(async (transaction) => {
                await transaction.nativeDelete(Account, { id: removed.id });
                return {
                    profile: await transaction.count(Profile, { account: removed.id }),
                    identifier: await transaction.count(Identifier, { account: removed.id }),
                    password: await transaction.count(Password, { account: removed.id }),
                    session: await transaction.count(Session, { account: removed.id }),
                    recoveryCode: await transaction.count(RecoveryCode, { account: removed.id }),
                    secondFactor: await transaction.count(SecondFactor, { account: removed.id }),
                    masterCode: await transaction.count(MasterCode, { account: removed.id }),
                    keptIdentifier: await transaction.count(Identifier, { account: kept.id }),
                    keptSession: await transaction.count(Session, { account: kept.id }),
                };
            });

            // Assert
            expect(counts).toEqual({
                profile: 0,
                identifier: 0,
                password: 0,
                session: 0,
                recoveryCode: 0,
                secondFactor: 0,
                masterCode: 0,
                keptIdentifier: 1,
                keptSession: 1,
            });
        });
    });
});
