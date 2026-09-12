import { AccountStatus } from "~context/enums";

import { CoreFixture } from "./core.fixture";

const OLD_DATE = new Date("2025-01-01T00:00:00.000Z");
const RECENT_DATE = new Date("2026-01-01T00:00:00.000Z");

export class AccountFixture extends CoreFixture implements Fixtures.Account.Contract {
    /**
     * Builds accounts with profiles and identifiers to verify account lookup by identity.
     */
    public async lookupScenario(): Fixtures.Account.LookupScenario.Result {
        const matched = await this.createAccount();
        await this.createProfile({
            displayName: "Ada Lovelace",
            account: matched,
        });
        await this.createIdentifier({
            identity: "ada.lovelace@example.test",
            account: matched,
            isVerified: true,
        });

        const other = await this.createAccount();
        await this.createProfile({
            displayName: "Grace Hopper",
            account: other,
        });
        await this.createIdentifier({
            identity: "unrelated-identity",
            isVerified: true,
            account: other,
        });

        return { matched, other };
    }

    /**
     * Builds accounts with profiles and identifiers to verify account lookup by display name.
     */
    public async displayNameLookupScenario(): Fixtures.Account.DisplayNameLookupScenario.Result {
        const matched = await this.createAccount();
        await this.createProfile({
            displayName: "Katherine Johnson",
            account: matched,
        });
        await this.createIdentifier({
            identity: "numeric-computing",
            isVerified: true,
            account: matched,
        });

        const other = await this.createAccount();
        await this.createProfile({
            displayName: "Dorothy Vaughan",
            account: other,
        });
        await this.createIdentifier({
            identity: "unrelated",
            isVerified: true,
            account: other,
        });

        return { matched, other };
    }

    /**
     * Builds accounts with equal trigram rank to verify lookup tie-breakers.
     */
    public async lookupSearchScenario(): Fixtures.Account.LookupSearchScenario.Result {
        const alphaAccess = await this.createAccount();
        await this.createProfile({
            displayName: "Alpha Access",
            account: alphaAccess,
        });

        const accessAlpha = await this.createAccount();
        await this.createProfile({
            displayName: "Access Alpha",
            account: accessAlpha,
        });

        await this.createAccount();

        return {
            expectedOrderedIDs: [accessAlpha.id, alphaAccess.id],
            term: "Alpha Access",
        };
    }

    /**
     * Builds named accounts in non-sorted insertion order to verify lookup ordering.
     */
    public async orderedLookupScenario(): Fixtures.Account.OrderedLookupScenario.Result {
        const bravo = await this.createAccount();
        await this.createProfile({
            displayName: "Bravo Account",
            account: bravo,
        });
        await this.createIdentifier({
            identity: "bravo@example.test",
            isVerified: true,
            account: bravo,
        });

        const charlie = await this.createAccount();
        await this.createProfile({
            displayName: "Charlie Account",
            account: charlie,
        });
        await this.createIdentifier({
            identity: "charlie@example.test",
            isVerified: true,
            account: charlie,
        });

        const alpha = await this.createAccount();
        await this.createProfile({
            displayName: "Alpha Account",
            account: alpha,
        });
        await this.createIdentifier({
            identity: "alpha@example.test",
            isVerified: true,
            account: alpha,
        });

        return { alpha, bravo, charlie };
    }

    /**
     * Builds pending and active accounts with old and recent timestamps to verify expiration queries.
     */
    public async expirationScenario(): Fixtures.Account.ExpirationScenario.Result {
        const oldPending = await this.createAccount({
            status: AccountStatus.PENDING,
            createdAt: OLD_DATE,
        });
        const recentPending = await this.createAccount({
            status: AccountStatus.PENDING,
            createdAt: RECENT_DATE,
        });
        const oldActive = await this.createAccount({
            status: AccountStatus.ACTIVE,
            createdAt: OLD_DATE,
        });
        const recentActive = await this.createAccount({
            status: AccountStatus.ACTIVE,
            createdAt: RECENT_DATE,
        });
        const touchedActive = await this.createAccount({
            status: AccountStatus.ACTIVE,
            lastActiveAt: RECENT_DATE,
            createdAt: OLD_DATE,
        });
        const updatedActive = await this.createAccount({
            status: AccountStatus.ACTIVE,
            updatedAt: RECENT_DATE,
            createdAt: OLD_DATE,
        });

        return {
            touchedActive,
            updatedActive,
            recentPending,
            recentActive,
            oldPending,
            oldActive,
        };
    }
    /**
     * Builds accounts at the exact expiration boundary to verify that the comparison stays strict.
     */
    public async expirationBoundaryScenario(): Fixtures.Account.ExpirationBoundaryScenario.Result {
        const expirationDate = new Date("2025-06-01T00:00:00.000Z");
        const beforeBoundary = new Date("2025-05-31T23:59:59.999Z");

        const boundaryPending = await this.createAccount({
            status: AccountStatus.PENDING,
            createdAt: expirationDate,
        });
        const boundaryActive = await this.createAccount({
            status: AccountStatus.ACTIVE,
            createdAt: expirationDate,
        });
        const expiredPending = await this.createAccount({
            status: AccountStatus.PENDING,
            createdAt: beforeBoundary,
        });
        const expiredActive = await this.createAccount({
            status: AccountStatus.ACTIVE,
            createdAt: beforeBoundary,
        });

        return { boundaryActive, boundaryPending, expirationDate, expiredActive, expiredPending };
    }

    /**
     * Builds active accounts whose activity watermark contradicts their other timestamps to verify COALESCE priority.
     */
    public async activityWatermarkScenario(): Fixtures.Account.ActivityWatermarkScenario.Result {
        const staleByActivity = await this.createAccount({
            status: AccountStatus.ACTIVE,
            createdAt: RECENT_DATE,
            lastActiveAt: OLD_DATE,
            updatedAt: RECENT_DATE,
        });
        const activeByActivity = await this.createAccount({
            status: AccountStatus.ACTIVE,
            lastActiveAt: RECENT_DATE,
            createdAt: OLD_DATE,
            updatedAt: OLD_DATE,
        });

        return { activeByActivity, staleByActivity };
    }

    /**
     * Builds an account without a profile to verify that profile-less accounts stay in the lookup output.
     */
    public async profilelessLookupScenario(): Fixtures.Account.ProfilelessLookupScenario.Result {
        const named = await this.createAccount();
        await this.createProfile({ account: named, displayName: "Named Account" });
        const anonymous = await this.createAccount();

        return { anonymous, named };
    }

    /**
     * Builds two fully populated accounts to verify that deleting one cascades to its own rows only.
     */
    public async cascadeScenario(): Fixtures.Account.CascadeScenario.Result {
        const removed = await this.createAccount();
        await this.populate(removed);

        const kept = await this.createAccount();
        await this.populate(kept);

        return { kept, removed };
    }

    private async populate(account: Entities.Account): Promise<void> {
        await this.createProfile({ account });
        await this.createIdentifier({ account });
        await this.createPassword({ account });
        await this.createSession({ account });
        await this.createRecoveryCode({ account });
        await this.createSecondFactor({ account });
        await this.createMasterCode({ account });
    }
}
