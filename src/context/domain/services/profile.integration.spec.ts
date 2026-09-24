import { describe, expect, it } from "@jest/globals";

import { ProfileIntegrationHelpers } from "~testing/integration/domain-service/profile.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { Profile } from "~context/domain/entities";

const helpers = new ProfileIntegrationHelpers();

async function loadProfile(suite: Integration.Domain.Profile.Suite, account: Entities.Account): Promise<Entities.Profile> {
    return await suite.transaction((transaction) =>
        transaction.findOneOrFail(Profile, {
            account: account.id,
        }),
    );
}

describe("ProfileService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("updates the persisted profile through the account repository populate path", async () => {
        const account = await suite.fixtures().createAccount();
        await suite.fixtures().createProfile({
            displayName: "Before",
            timeZone: "UTC",
            locale: "en",
            account,
        });

        await suite.transaction((transaction) =>
            suite.repository().profileService.update({
                input: {
                    patch: {
                        displayName: "After",
                        timeZone: "Europe/Moscow",
                        locale: "ru",
                    },
                    account: account.id,
                },
                transaction,
            }),
        );

        const profile = await loadProfile(suite, account);

        expect(profile).toMatchObject({
            displayName: "After",
            timeZone: "Europe/Moscow",
            locale: "ru",
        });
        expect(profile.updatedAt).toBeInstanceOf(Date);
    });
});
