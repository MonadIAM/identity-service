import { describe, expect, it } from "@jest/globals";

import { ChangeLogIntegrationHelpers } from "~testing/integration/domain-service/change-log.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ChangeLog } from "~common/transaction-manager/entities";

const helpers = new ChangeLogIntegrationHelpers();

async function countChangeLogs(suite: Integration.Domain.ChangeLog.Suite): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(ChangeLog, {}));
}

async function ageChangeLogs(
    suite: Integration.Domain.ChangeLog.Suite,
    logs: SystemEntities.ChangeLog[],
    createdAt: Date,
): Promise<void> {
    await suite.transaction(async (transaction) => {
        const entities = await transaction.find(ChangeLog, { id: { $in: logs.map(({ id }) => id) } });

        for (const entity of entities) {
            entity.createdAt = new Date(createdAt);
        }

        await transaction.flush();
    });
}

describe("ChangeLogService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("purges only expired change logs by batch size", async () => {
        const expired = [await suite.fixtures().createChangeLog(), await suite.fixtures().createChangeLog()];
        const fresh = await suite.fixtures().createChangeLog();
        await ageChangeLogs(suite, expired, new Date("2025-01-01T00:00:00.000Z"));

        const purged = await suite.transaction((transaction) =>
            suite.repository().changeLogService.purgeExpired({
                expirationDate: new Date("2026-01-01T00:00:00.000Z"),
                batchSize: 3,
                transaction,
            }),
        );

        expect(purged).toHaveLength(2);
        await expect(countChangeLogs(suite)).resolves.toBe(1);
        await expect(
            suite.transaction((transaction) => transaction.findOneOrFail(ChangeLog, { id: fresh.id })),
        ).resolves.toMatchObject({ id: fresh.id });
    });
});
