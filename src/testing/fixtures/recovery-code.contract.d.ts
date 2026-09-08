declare namespace Fixtures {
    namespace RecoveryCode {
        interface Contract extends Fixtures.Core.Contract {
            statusScenario: StatusScenario.Signature;
        }

        namespace StatusScenario {
            type Result = Promise<{
                account: Entities.Account;
                other: Entities.Account;
            }>;

            type Signature = () => Result;
        }
    }
}
