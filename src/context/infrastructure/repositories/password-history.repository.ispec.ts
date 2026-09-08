import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/fixtures/core.fixture";

import { PasswordHistoryRepository } from "./password-history.repository";

describe("PasswordHistoryRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PasswordHistoryRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted password history entry through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const history = await suite.fixtures().createPasswordHistory({
            hash: "mapping-previous-hash",
            version: 4,
            account,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: history.id } });

        expect(loaded).toMatchObject({
            hash: "mapping-previous-hash",
            setAt: history.setAt,
            id: history.id,
            version: 4,
        });
        expect(loaded.account.id).toBe(account.id);
    });
});
