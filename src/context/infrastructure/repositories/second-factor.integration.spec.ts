import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { SecondFactorType } from "~context/enums";

import { SecondFactorRepository } from "./second-factor.repository";

describe("SecondFactorRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new SecondFactorRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted second factor through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        const secondFactor = await suite.fixtures().createSecondFactor({
            type: SecondFactorType.TOTP,
            lastAcceptedTOTPStep: 58312345,
            secret: "mapping-secret",
            name: "Mapping Factor",
            confirmed: true,
            account,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: secondFactor.id } });

        expect(loaded).toMatchObject({
            confirmedAt: secondFactor.confirmedAt,
            createdAt: secondFactor.createdAt,
            lastAcceptedTOTPStep: 58312345,
            type: SecondFactorType.TOTP,
            secret: "mapping-secret",
            name: "Mapping Factor",
            id: secondFactor.id,
        });
        expect(typeof loaded.lastAcceptedTOTPStep).toBe("number");
        expect(loaded.account.id).toBe(account.id);
    });
});
