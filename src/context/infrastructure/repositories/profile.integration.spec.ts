import { describe, expect, it } from "@jest/globals";

import { postgresSuite } from "~testing/integration/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";

import { ProfileRepository } from "./profile.repository";

describe("ProfileRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new ProfileRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("maps the persisted profile through the schema", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createProfile({
            pictureUrl: "https://mapping.test/avatar.png",
            displayName: "Mapping Profile",
            timeZone: "Europe/Moscow",
            locale: "ru-RU",
            account,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { account } });

        expect(loaded).toMatchObject({
            pictureUrl: "https://mapping.test/avatar.png",
            displayName: "Mapping Profile",
            timeZone: "Europe/Moscow",
            locale: "ru-RU",
        });
        expect(loaded.account.id).toBe(account.id);
    });
});
