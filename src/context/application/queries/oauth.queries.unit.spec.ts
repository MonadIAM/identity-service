import { describe, expect, it } from "@jest/globals";

import { OAuthQueriesUnitHelpers } from "~testing/unit/query-services/oauth.helpers";

const helpers = new OAuthQueriesUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("OAuthQueries", () => {
    it("rejects userinfo without openid before reading account data", async () => {
        const { queries, accountRepository, jwtService } = helpers.queries();

        await expect(queries.getUserInfo({ account: ACTOR, client: ID, scope: "profile email" })).rejects.toThrow();

        expect(accountRepository.findUniqueOrThrow).not.toHaveBeenCalled();
        expect(jwtService.computePairwiseSubject).not.toHaveBeenCalled();
    });

    it.each([
        { scope: "openid", profile: false, email: false },
        { scope: "openid profile", profile: true, email: false },
        { scope: "openid email", profile: false, email: true },
        { scope: "openid profile email", profile: true, email: true },
    ])("discloses only claims authorized by $scope", async ({ scope, profile, email }) => {
        const { queries, accountRepository, jwtService } = helpers.queries();
        const account = helpers.createAccount({ id: ACTOR });
        account.profile = helpers.createProfile({
            account,
            displayName: "Test User",
            updatedAt: new Date("2025-01-01T00:00:00.900Z"),
        });
        account.identifiers = helpers.collection({
            owner: account,
            items: [helpers.createIdentifier({ account, identity: "mail@example.test", isVerified: true })],
        });
        accountRepository.findUniqueOrThrow.mockResolvedValue(account);
        jwtService.computePairwiseSubject.mockResolvedValue("pairwise-subject");

        const claims = await queries.getUserInfo({ account: ACTOR, client: ID, scope });

        expect(jwtService.computePairwiseSubject.mock.calls).toEqual([[{ account: ACTOR, client: ID }]]);
        expect(claims).toEqual({
            sub: "pairwise-subject",
            ...(profile
                ? {
                      name: "Test User",
                      picture: account.profile.pictureUrl,
                      locale: account.profile.locale,
                      zoneinfo: account.profile.timeZone,
                      updatedAt: 1735689600,
                  }
                : {}),
            ...(email ? { email: "mail@example.test", emailVerified: true } : {}),
        });
    });

    it("omits optional claims when the account has no profile or email", async () => {
        const { queries, accountRepository, jwtService } = helpers.queries();
        const account = helpers.createAccount();
        account.identifiers = helpers.collection({ owner: account, items: [] });
        accountRepository.findUniqueOrThrow.mockResolvedValue(account);
        jwtService.computePairwiseSubject.mockResolvedValue("pairwise-subject");

        const claims = await queries.getUserInfo({ account: ACTOR, client: ID, scope: "openid profile email" });

        expect(claims).toEqual({ sub: "pairwise-subject" });
    });
});
