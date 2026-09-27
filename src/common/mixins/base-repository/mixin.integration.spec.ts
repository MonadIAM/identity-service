import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { PublicStringOperator } from "~infrastructure/database/enums";
import { AccountMapper } from "~context/infrastructure/mappers";
import { AccountStatus, AccountSubject } from "~context/enums";
import { Account } from "~context/domain/entities";

import { BaseRepository } from "./mixin";

class TestRepository extends BaseRepository<Entities.Account, Repositories.Mappers.Account.Types>({
    Mapper: AccountMapper,
    Entity: Account,
}) {
    public constructor(protected readonly readManager: ORM.EntityManager) {
        super();
    }
}

describe("BaseRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new TestRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("findUnique", () => {
        it("finds one entity or null by ORM where query", async () => {
            const account = await suite.fixtures().createAccount();

            await expect(suite.repository().findUnique({ where: { id: account.id } })).resolves.toMatchObject({
                id: account.id,
                status: account.status,
            });
            await expect(
                suite.repository().findUnique({
                    where: { id: "00000000-0000-0000-0000-000000000000" },
                }),
            ).resolves.toBeNull();
        });
    });

    describe("findUniqueOrThrow", () => {
        it("finds one required entity by ORM where query", async () => {
            const account = await suite.fixtures().createAccount();

            await expect(suite.repository().findUniqueOrThrow({ where: { id: account.id } })).resolves.toMatchObject({
                id: account.id,
                subject: account.subject,
            });
        });
    });

    describe("find", () => {
        it("finds all entities matching an ORM where query", async () => {
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.ACTIVE });

            const accounts = await suite.repository().find({
                where: { status: AccountStatus.PENDING },
            });

            expect(accounts).toHaveLength(2);
            expect(accounts.every(({ status }) => status === AccountStatus.PENDING)).toBe(true);
        });
    });

    describe("findMany", () => {
        it("finds and counts entities using explicit ORM where and options", async () => {
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });

            const [accounts, total] = await suite.repository().findMany({
                options: { orderBy: { createdAt: QueryOrder.ASC } },
                where: { status: AccountStatus.PENDING },
            });

            expect(total).toBe(2);
            expect(accounts).toHaveLength(2);
        });

        it("finds and counts entities using mapper filters, sort and pagination", async () => {
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });

            const [accounts, total] = await suite.repository().findMany({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: {
                    status: {
                        operator: PublicStringOperator.EQUAL,
                        value: AccountStatus.PENDING,
                    },
                },
            });

            expect(total).toBe(3);
            expect(accounts).toHaveLength(2);
        });

        it("keeps mapper pagination stable when creation timestamps are equal", async () => {
            const createdAt = new Date("2026-01-01T00:00:00.000Z");
            const first = await suite.fixtures().createAccount({ status: AccountStatus.PENDING, createdAt });
            const second = await suite.fixtures().createAccount({ status: AccountStatus.PENDING, createdAt });
            const third = await suite.fixtures().createAccount({ status: AccountStatus.PENDING, createdAt });
            const expectedIDs = [first, second, third]
                .sort((left, right) => left.id.localeCompare(right.id))
                .map(({ id }) => id);

            const [firstPage, total] = await suite.repository().findMany({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: {
                    status: {
                        operator: PublicStringOperator.EQUAL,
                        value: AccountStatus.PENDING,
                    },
                },
            });
            const [secondPage] = await suite.repository().findMany({
                pagination: { currentPage: 2, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: {
                    status: {
                        operator: PublicStringOperator.EQUAL,
                        value: AccountStatus.PENDING,
                    },
                },
            });

            expect(total).toBe(expectedIDs.length);
            expect([...firstPage, ...secondPage].map(({ id }) => id)).toEqual(expectedIDs);
        });

        it("finds and counts entities using mapper filters combined with prefilter", async () => {
            await suite.fixtures().createAccount({
                status: AccountStatus.PENDING,
                subject: AccountSubject.HUMAN,
            });
            await suite.fixtures().createAccount({
                subject: AccountSubject.SERVICE,
                status: AccountStatus.PENDING,
            });
            await suite.fixtures().createAccount({
                subject: AccountSubject.HUMAN,
                status: AccountStatus.ACTIVE,
            });

            const [accounts, total] = await suite.repository().findMany({
                prefilter: { subject: AccountSubject.HUMAN },
                filters: {
                    status: {
                        operator: PublicStringOperator.EQUAL,
                        value: AccountStatus.PENDING,
                    },
                },
                sort: { createdAt: QueryOrder.ASC },
                pagination: { currentPage: 1, elementsPerPage: 10 },
            });

            expect(total).toBe(1);
            expect(accounts[0]?.status).toBe(AccountStatus.PENDING);
            expect(accounts[0]?.subject).toBe(AccountSubject.HUMAN);
        });
    });
});
