import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { MasterCodeRepository } from "./master-code.repository";

describe("MasterCodeRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new MasterCodeRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted master code through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const masterCode = await suite.fixtures().createMasterCode({ account, hash: "mapping-master-hash" });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { account } });

        expect(loaded).toMatchObject({
            createdAt: masterCode.createdAt,
            hash: "mapping-master-hash",
        });
        expect(loaded.account.id).toBe(account.id);
    });
});
