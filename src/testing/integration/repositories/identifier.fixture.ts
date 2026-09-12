import { IdentifierType } from "~context/enums";

import { CoreFixture } from "./core.fixture";

export class IdentifierFixture extends CoreFixture implements Fixtures.Identifier.Contract {
    /**
     * Builds account identifiers and an external account to verify identifier lookup scoping.
     */
    public async lookupScenario(): Fixtures.Identifier.LookupScenario.Result {
        const account = await this.createAccount();
        await this.createProfile({ account, displayName: "Nora Account" });
        const matched = await this.createIdentifier({
            identity: "nora.primary@example.test",
            isVerified: true,
            account,
        });
        await this.createIdentifier({
            account,
            identity: "+15550001111",
            type: IdentifierType.PHONE,
        });

        const other = await this.createAccount();
        await this.createProfile({
            displayName: "Nora External",
            account: other,
        });
        const otherAccount = await this.createIdentifier({
            identity: "nora.external@example.test",
            account: other,
        });

        return { account, matched, otherAccount };
    }

    /**
     * Builds identifiers with profile data to verify profile-backed identifier lookup.
     */
    public async profileLookupScenario(): Fixtures.Identifier.ProfileLookupScenario.Result {
        const account = await this.createAccount();
        await this.createProfile({ account, displayName: "Mina Profile" });
        const matched = await this.createIdentifier({
            identity: "profile-match@example.test",
            account,
        });

        const other = await this.createAccount();
        await this.createProfile({
            displayName: "Mina External",
            account: other,
        });
        const otherAccount = await this.createIdentifier({
            identity: "profile-external@example.test",
            account: other,
        });

        return { account, matched, otherAccount };
    }

    /**
     * Builds identifiers with equal trigram rank to verify lookup tie-breakers within one account.
     */
    public async lookupSearchScenario(): Fixtures.Identifier.LookupSearchScenario.Result {
        const account = await this.createAccount();
        await this.createProfile({ account, displayName: "Lookup Owner" });
        const alphaAccess = await this.createIdentifier({
            identity: "Alpha Access",
            account,
        });
        const accessAlpha = await this.createIdentifier({
            identity: "Access Alpha",
            account,
        });
        await this.createIdentifier({
            identity: "Billing Audit",
            account,
        });

        return {
            expectedOrderedIDs: [accessAlpha.id, alphaAccess.id],
            term: "Alpha Access",
            account,
        };
    }

    /**
     * Builds identifiers in non-sorted insertion order to verify lookup ordering within one account.
     */
    public async orderedLookupScenario(): Fixtures.Identifier.OrderedLookupScenario.Result {
        const account = await this.createAccount();
        await this.createProfile({ account, displayName: "Lookup Owner" });

        const bravo = await this.createIdentifier({
            identity: "bravo@example.test",
            account,
        });
        const charlie = await this.createIdentifier({
            identity: "charlie@example.test",
            account,
        });
        const alpha = await this.createIdentifier({
            identity: "alpha@example.test",
            account,
        });

        const other = await this.createAccount();
        await this.createProfile({
            displayName: "Other Owner",
            account: other,
        });
        const otherAccount = await this.createIdentifier({
            identity: "aaron@example.test",
            account: other,
        });

        return { account, alpha, bravo, charlie, otherAccount };
    }

    /**
     * Builds verified, unverified, and single-identifier accounts to verify public contact invariants.
     */
    public async verificationScenario(): Fixtures.Identifier.VerificationScenario.Result {
        const account = await this.createAccount();
        const first = await this.createIdentifier({
            identity: "first@example.test",
            isVerified: true,
            account,
        });
        const second = await this.createIdentifier({
            identity: "second@example.test",
            isVerified: true,
            account,
        });
        const unverified = await this.createIdentifier({
            identity: "pending@example.test",
            account,
        });
        const soloAccount = await this.createAccount();
        const solo = await this.createIdentifier({
            identity: "solo@example.test",
            account: soloAccount,
            isVerified: true,
        });

        return { account, first, second, solo, soloAccount, unverified };
    }
}
