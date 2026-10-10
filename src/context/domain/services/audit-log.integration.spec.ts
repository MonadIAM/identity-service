import { describe, expect, it } from "@jest/globals";

import { AuditLogIntegrationHelpers } from "~testing/integration/domain-service/audit-log.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { AuditLog } from "~common/transaction-manager/entities";

const helpers = new AuditLogIntegrationHelpers();

async function countAuditLogs(suite: Integration.Domain.AuditLog.Suite): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(AuditLog, {}));
}

async function ageAuditLogs(
    suite: Integration.Domain.AuditLog.Suite,
    logs: SystemEntities.AuditLog[],
    createdAt: Date,
): Promise<void> {
    await suite.transaction(async (transaction) => {
        const entities = await transaction.find(AuditLog, { id: { $in: logs.map(({ id }) => id) } });

        for (const entity of entities) {
            entity.createdAt = new Date(createdAt);
        }

        await transaction.flush();
    });
}

describe("[DomainService] - AuditLog", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - purgeExpired", () => {
        it("[case] - purges only expired audit logs by batch size", async () => {
            // Arrange
            const expired = [await suite.fixtures().createAuditLog(), await suite.fixtures().createAuditLog()];
            const fresh = await suite.fixtures().createAuditLog();
            await ageAuditLogs(suite, expired, new Date("2025-01-01T00:00:00.000Z"));

            // Act
            const purged = await suite.transaction((transaction) =>
                suite.repository().auditLogService.purgeExpired({
                    expirationDate: new Date("2026-01-01T00:00:00.000Z"),
                    batchSize: 3,
                    transaction,
                }),
            );
            const result = await countAuditLogs(suite);
            const result1 = await suite.transaction((transaction) => transaction.findOneOrFail(AuditLog, { id: fresh.id }));

            // Assert
            expect(purged).toHaveLength(2);
            expect(result).toBe(1);
            expect(result1).toMatchObject({ id: fresh.id });
        });
    });
});
