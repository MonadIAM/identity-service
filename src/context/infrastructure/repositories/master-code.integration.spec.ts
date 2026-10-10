import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { MasterCodeRepository } from "./master-code.repository";

describe("[Repository] - MasterCode", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new MasterCodeRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted master code through the schema", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const masterCode = await suite.fixtures().createMasterCode({ account, hash: "mapping-master-hash" });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { account } });

            // Assert
            expect(loaded).toMatchObject({
                createdAt: masterCode.createdAt,
                hash: "mapping-master-hash",
            });
            expect(loaded.account.id).toBe(account.id);
        });
    });
});
