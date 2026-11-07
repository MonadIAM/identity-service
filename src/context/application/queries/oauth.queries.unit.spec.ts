import { describe, expect, it } from "@jest/globals";

import { OAuthQueriesUnitHelpers } from "~testing/unit/query-services/oauth.helpers";

const helpers = new OAuthQueriesUnitHelpers();
const ACTOR = "actor-account";
const ID = "entity-a";

describe("[Queries] - OAuth", () => {
    describe("[Behavior] - discovery metadata", () => {
        it("[case] - publishes HTTPS endpoints, the root JWKS URL and RS256 for ID tokens", () => {
            // Arrange
            const { queries } = helpers.queries();
            const issuer = "https://identity.example.test";

            // Act
            const metadata = queries.getAuthorizationServerMetadata();
            const openid = queries.getOpenIdConfiguration();

            // Assert
            expect(metadata).toMatchObject({
                issuer,
                authorizationEndpoint: `${issuer}/api/v1/oauth/authorize`,
                tokenEndpoint: `${issuer}/api/v1/oauth/token`,
                revocationEndpoint: `${issuer}/api/v1/oauth/revoke`,
                jwksURI: `${issuer}/.well-known/jwks.json`,
            });
            expect(openid).toMatchObject({
                ...metadata,
                userinfoEndpoint: `${issuer}/api/v1/oauth/userinfo`,
                endSessionEndpoint: `${issuer}/api/v1/oauth/logout`,
                idTokenSigningAlgValuesSupported: ["RS256"],
            });
        });
    });

    describe("[Method] - getUserInfo", () => {
        it("[case] - rejects userinfo without openid before reading account data", async () => {
            // Arrange
            const { queries, accountRepository, jwtService } = helpers.queries();

            // Act
            const result = queries.getUserInfo({ account: ACTOR, client: ID, scope: "profile email" });

            // Assert
            await expect(result).rejects.toThrow();
            expect(accountRepository.findUniqueOrThrow).not.toHaveBeenCalled();
            expect(jwtService.computePairwiseSubject).not.toHaveBeenCalled();
        });

        it.each([
            { scope: "openid", profile: false, email: false },
            { scope: "openid profile", profile: true, email: false },
            { scope: "openid email", profile: false, email: true },
            { scope: "openid profile email", profile: true, email: true },
        ])("[case] - discloses only claims authorized by $scope", async ({ scope, profile, email }) => {
            // Arrange
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

            // Act
            const claims = await queries.getUserInfo({ account: ACTOR, client: ID, scope });

            // Assert
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

        it("[case] - omits optional claims when the account has no profile or email", async () => {
            // Arrange
            const { queries, accountRepository, jwtService } = helpers.queries();
            const account = helpers.createAccount();
            account.identifiers = helpers.collection({ owner: account, items: [] });
            accountRepository.findUniqueOrThrow.mockResolvedValue(account);
            jwtService.computePairwiseSubject.mockResolvedValue("pairwise-subject");

            // Act
            const claims = await queries.getUserInfo({ account: ACTOR, client: ID, scope: "openid profile email" });

            // Assert
            expect(claims).toEqual({ sub: "pairwise-subject" });
        });
    });
});
