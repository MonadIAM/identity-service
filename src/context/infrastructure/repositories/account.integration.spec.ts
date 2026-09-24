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

describe("AccountRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager, writeManager }) => new AccountRepository(readManager, writeManager),
        fixture: (entityManager) => new AccountFixture(entityManager),
    });

    it("maps the persisted account through the schema", async () => {
        const account = await suite.fixtures().createAccount({
            lastActiveAt: new Date("2026-02-01T00:00:00.000Z"),
            updatedAt: new Date("2026-03-01T00:00:00.000Z"),
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            subject: AccountSubject.SERVICE,
            status: AccountStatus.SUSPENDED,
            is2FAEnforced: true,
        });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: account.id } })).resolves.toMatchObject({
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
        "returns account lookup rows matched by $match trigram",
        async ({ fixture, term, identifier, displayName }) => {
            const { matched } = await suite.fixtures()[fixture]();

            const [rows, total] = await suite.repository().getLookupList({
                term,
                pagination: { currentPage: 1, elementsPerPage: 10 },
            });

            expect(total).toBe(1);
            expect(rows).toEqual([{ identifier, displayName, status: matched.status, id: matched.id }]);
        },
    );

    it("uses trigram lookup with stable display name tie-breakers", async () => {
        const scenario = await suite.fixtures().lookupSearchScenario();

        const [rows] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 10 },
            term: scenario.term,
        });

        expect(rows.map(({ id }) => id)).toEqual(scenario.expectedOrderedIDs);
    });

    it("returns account lookup page ordered by display name when term is empty", async () => {
        const { alpha, bravo, charlie } = await suite.fixtures().orderedLookupScenario();

        const [rows, total] = await suite.repository().getLookupList({
            term: "",
            pagination: { currentPage: 1, elementsPerPage: 2 },
        });

        expect(total).toBe(3);
        expect(rows.map(({ id }) => id)).toEqual([alpha.id, bravo.id]);
        expect(rows.map(({ id }) => id)).not.toContain(charlie.id);
    });

    it("finds expired pending accounts by creation time", async () => {
        const { oldPending, recentPending } = await suite.fixtures().expirationScenario();

        const accounts = await suite.repository().findExpiredPending({
            expirationDate: new Date("2025-06-01T00:00:00.000Z"),
            batchSize: 10,
        });

        expect(accounts.map(({ id }) => id)).toContain(oldPending.id);
        expect(accounts.map(({ id }) => id)).not.toContain(recentPending.id);
    });

    it("finds expired inactive accounts by activity watermark", async () => {
        const { oldActive, recentActive, touchedActive, updatedActive } = await suite.fixtures().expirationScenario();

        const accounts = await suite.repository().findExpiredInactive({
            expirationDate: new Date("2025-06-01T00:00:00.000Z"),
            batchSize: 1,
        });

        expect(accounts).toHaveLength(1);
        expect(accounts.map(({ id }) => id)).toContain(oldActive.id);
        expect(accounts.map(({ id }) => id)).not.toContain(recentActive.id);
        expect(accounts.map(({ id }) => id)).not.toContain(touchedActive.id);
        expect(accounts.map(({ id }) => id)).not.toContain(updatedActive.id);
    });

    it("keeps the expiration comparison strict at the boundary", async () => {
        const scenario = await suite.fixtures().expirationBoundaryScenario();

        const pending = await suite.repository().findExpiredPending({
            expirationDate: scenario.expirationDate,
            batchSize: 10,
        });
        const inactive = await suite.repository().findExpiredInactive({
            expirationDate: scenario.expirationDate,
            batchSize: 10,
        });

        expect(pending.map(({ id }) => id)).toEqual([scenario.expiredPending.id]);
        expect(inactive.map(({ id }) => id)).toEqual([scenario.expiredActive.id]);
    });

    it("prefers the activity watermark over update and creation timestamps", async () => {
        const { activeByActivity, staleByActivity } = await suite.fixtures().activityWatermarkScenario();

        const accounts = await suite.repository().findExpiredInactive({
            expirationDate: new Date("2025-06-01T00:00:00.000Z"),
            batchSize: 10,
        });

        expect(accounts.map(({ id }) => id)).toEqual([staleByActivity.id]);
        expect(accounts.map(({ id }) => id)).not.toContain(activeByActivity.id);
    });

    it("returns the second account lookup page without gaps or repeats", async () => {
        const { alpha, bravo, charlie } = await suite.fixtures().orderedLookupScenario();

        const [firstPage, total] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 2 },
            term: "",
        });
        const [secondPage] = await suite.repository().getLookupList({
            pagination: { currentPage: 2, elementsPerPage: 2 },
            term: "",
        });

        expect(total).toBe(3);
        expect([...firstPage, ...secondPage].map(({ id }) => id)).toEqual([alpha.id, bravo.id, charlie.id]);
    });

    it("keeps accounts without a profile in the lookup output", async () => {
        const { anonymous, named } = await suite.fixtures().profilelessLookupScenario();

        const [rows, total] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 10 },
            term: "",
        });

        expect(total).toBe(2);
        expect(rows.map(({ id }) => id)).toEqual([named.id, anonymous.id]);
        expect(rows.map(({ displayName }) => displayName)).toEqual(["Named Account", null]);
    });

    it("cascades account deletion to its own credentials only", async () => {
        const { kept, removed } = await suite.fixtures().cascadeScenario();

        await suite.transaction(async (transaction) => {
            await transaction.nativeDelete(Account, { id: removed.id });

            await expect(transaction.count(Profile, { account: removed.id })).resolves.toBe(0);
            await expect(transaction.count(Identifier, { account: removed.id })).resolves.toBe(0);
            await expect(transaction.count(Password, { account: removed.id })).resolves.toBe(0);
            await expect(transaction.count(Session, { account: removed.id })).resolves.toBe(0);
            await expect(transaction.count(RecoveryCode, { account: removed.id })).resolves.toBe(0);
            await expect(transaction.count(SecondFactor, { account: removed.id })).resolves.toBe(0);
            await expect(transaction.count(MasterCode, { account: removed.id })).resolves.toBe(0);

            await expect(transaction.count(Identifier, { account: kept.id })).resolves.toBe(1);
            await expect(transaction.count(Session, { account: kept.id })).resolves.toBe(1);
        });
    });
});
