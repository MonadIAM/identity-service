import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { ProfileUnitHelpers } from "~testing/unit/domain-service/profile.helpers";

const ACCOUNT_ID = "00000000-0000-4000-8000-400000000001";

const helpers = new ProfileUnitHelpers();

describe("ProfileService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("update", () => {
        it("loads the account with its profile and applies the patch to the profile", async () => {
            const account = helpers.createAccount({ id: ACCOUNT_ID });
            account.profile = helpers.createProfile({ account });
            const { service, repositories, transaction } = helpers.service({ account });
            const updateSpy = jest.spyOn(account.profile, "update");

            await service.update({
                input: { account: ACCOUNT_ID, patch: { displayName: "Updated Account" } },
                transaction: transaction.entityManager,
            });

            expect(repositories.accounts.findUniqueOrThrow).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                options: { populate: ["profile"] },
                where: { id: ACCOUNT_ID },
            });
            expect(updateSpy).toHaveBeenCalledWith({ displayName: "Updated Account" });
        });
    });
});
