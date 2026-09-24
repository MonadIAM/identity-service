import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { RecoveryCodeFixture } from "~testing/integration/repositories/recovery-code.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

import { RecoveryCodeRepository } from "./recovery-code.repository";

describe("RecoveryCodeRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RecoveryCodeRepository(readManager),
        fixture: (entityManager) => new RecoveryCodeFixture(entityManager),
    });

    it("maps the persisted recovery code through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const code = await suite.fixtures().createRecoveryCode({ account, hash: "mapping-hash", used: true });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: code.id } });

        expect(loaded).toMatchObject({
            createdAt: code.createdAt,
            hash: "mapping-hash",
            usedAt: code.usedAt,
            id: code.id,
        });
        expect(loaded.account.id).toBe(account.id);
    });

    it("counts recovery code status per account", async () => {
        const { account } = await suite.fixtures().statusScenario();

        await expect(suite.repository().getStatus({ account: account.id })).resolves.toEqual({
            remaining: 2,
            total: 3,
            used: 1,
        });
    });

    it("returns zero status for account without recovery codes", async () => {
        await expect(suite.repository().getStatus({ account: randomUUID() })).resolves.toEqual({
            remaining: 0,
            total: 0,
            used: 0,
        });
    });
});
