import { CoreFixture } from "./core.fixture";

export class RecoveryCodeFixture extends CoreFixture implements Fixtures.RecoveryCode.Contract {
    /**
     * Builds used and unused recovery codes across accounts to verify account-scoped status counts.
     */
    public async statusScenario(): Fixtures.RecoveryCode.StatusScenario.Result {
        const account = await this.createAccount();
        const other = await this.createAccount();

        await this.createRecoveryCode({ account, hash: "first", used: true });
        await this.createRecoveryCode({ account, hash: "second" });
        await this.createRecoveryCode({ account, hash: "third" });
        await this.createRecoveryCode({
            hash: "external",
            account: other,
            used: true,
        });

        return { account, other };
    }
}
