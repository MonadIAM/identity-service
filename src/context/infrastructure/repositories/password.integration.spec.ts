import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { PasswordRepository } from "./password.repository";

describe("[Repository] - Password", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PasswordRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted password through the schema", async () => {
            // Arrange
            const account = await suite.fixtures().createAccount();
            const password = await suite.fixtures().createPassword({ account, hash: "mapping-password-hash" });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { account } });

            // Assert
            expect(loaded).toMatchObject({
                hash: "mapping-password-hash",
                version: password.version,
                setAt: password.setAt,
            });
            expect(loaded.account.id).toBe(account.id);
        });
    });
});
