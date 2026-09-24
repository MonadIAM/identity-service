import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { PasswordRepository } from "./password.repository";

describe("PasswordRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PasswordRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted password through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const password = await suite.fixtures().createPassword({ account, hash: "mapping-password-hash" });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { account } });

        expect(loaded).toMatchObject({
            hash: "mapping-password-hash",
            version: password.version,
            setAt: password.setAt,
        });
        expect(loaded.account.id).toBe(account.id);
    });
});
