import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { PasswordHistoryRepository } from "./password-history.repository";

describe("[Repository] - PasswordHistory", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PasswordHistoryRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted password history entry through the schema", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const history = await suite.fixtures().createPasswordHistory({
                hash: "mapping-previous-hash",
                version: 4,
                account,
            });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: history.id } });

            // Assert
            expect(loaded).toMatchObject({
                hash: "mapping-previous-hash",
                setAt: history.setAt,
                id: history.id,
                version: 4,
            });
            expect(loaded.account.id).toBe(account.id);
        });
    });
});
