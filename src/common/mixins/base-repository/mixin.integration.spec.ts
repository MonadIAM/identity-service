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

describe("[Mixin] - BaseRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new TestRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - findUnique", () => {
        it("[case] - finds one entity or null by ORM where query", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();

            // Act
            const result = await suite.repository().findUnique({ where: { id: account.id } });
            const result1 = await suite.repository().findUnique({
                where: { id: "00000000-0000-0000-0000-000000000000" },
            });

            // Assert
            expect(result).toMatchObject({
                id: account.id,
                status: account.status,
            });
            expect(result1).toBeNull();
        });
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - finds one required entity by ORM where query", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();

            // Act
            const result = await suite.repository().findUniqueOrThrow({ where: { id: account.id } });

            // Assert
            expect(result).toMatchObject({
                id: account.id,
                subject: account.subject,
            });
        });
    });

    describe("[Method] - find", () => {
        it("[case] - finds all entities matching an ORM where query", async () => {
            // Arrange
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.ACTIVE });

            // Act
            const accounts = await suite.repository().find({
                where: { status: AccountStatus.PENDING },
            });
            const result = accounts.every(({ status }) => status === AccountStatus.PENDING);

            // Assert
            expect(accounts).toHaveLength(2);
            expect(result).toBe(true);
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - finds and counts entities using explicit ORM where and options", async () => {
            // Arrange
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });

            // Act
            const [accounts, total] = await suite.repository().findMany({
                options: { orderBy: { createdAt: QueryOrder.ASC } },
                where: { status: AccountStatus.PENDING },
            });

            // Assert
            expect(total).toBe(2);
            expect(accounts).toHaveLength(2);
        });

        it("[case] - finds and counts entities using mapper filters, sort and pagination", async () => {
            // Arrange
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });
            await suite.fixtures().createAccount({ status: AccountStatus.PENDING });

            // Act
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

            // Assert
            expect(total).toBe(3);
            expect(accounts).toHaveLength(2);
        });

        it("[case] - keeps mapper pagination stable when creation timestamps are equal", async () => {
            // Arrange
            const createdAt = new Date("2026-01-01T00:00:00.000Z");
            const first = await suite.fixtures().createAccount({ status: AccountStatus.PENDING, createdAt });
            const second = await suite.fixtures().createAccount({ status: AccountStatus.PENDING, createdAt });
            const third = await suite.fixtures().createAccount({ status: AccountStatus.PENDING, createdAt });
            const expectedIDs = [first, second, third]
                .sort((left, right) => left.id.localeCompare(right.id))
                .map(({ id }) => id);

            // Act
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
            const result = [...firstPage, ...secondPage].map(({ id }) => id);

            // Assert
            expect(total).toBe(expectedIDs.length);
            expect(result).toEqual(expectedIDs);
        });

        it("[case] - finds and counts entities using mapper filters combined with prefilter", async () => {
            // Arrange
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

            // Act
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

            // Assert
            expect(total).toBe(1);
            expect(accounts[0]?.status).toBe(AccountStatus.PENDING);
            expect(accounts[0]?.subject).toBe(AccountSubject.HUMAN);
        });
    });
});
