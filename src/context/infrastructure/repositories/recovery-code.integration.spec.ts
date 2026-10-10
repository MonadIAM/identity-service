import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { RecoveryCodeFixture } from "~testing/integration/repositories/recovery-code.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

import { RecoveryCodeRepository } from "./recovery-code.repository";

describe("[Repository] - RecoveryCode", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RecoveryCodeRepository(readManager),
        fixture: (entityManager) => new RecoveryCodeFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted recovery code through the schema", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const code = await suite.fixtures().createRecoveryCode({ account, hash: "mapping-hash", used: true });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: code.id } });

            // Assert
            expect(loaded).toMatchObject({
                createdAt: code.createdAt,
                hash: "mapping-hash",
                usedAt: code.usedAt,
                id: code.id,
            });
            expect(loaded.account.id).toBe(account.id);
        });
    });

    describe("[Method] - getStatus", () => {
        it("[case] - counts recovery code status per account", async () => {
            // Arrange
            const { account } = await suite.fixtures().statusScenario();

            // Act
            const result = await suite.repository().getStatus({ account: account.id });

            // Assert
            expect(result).toEqual({
                remaining: 2,
                total: 3,
                used: 1,
            });
        });

        it("[case] - returns zero status for account without recovery codes", async () => {
            // Arrange

            // Act
            const result = await suite.repository().getStatus({ account: randomUUID() });

            // Assert
            expect(result).toEqual({
                remaining: 0,
                total: 0,
                used: 0,
            });
        });
    });
});
