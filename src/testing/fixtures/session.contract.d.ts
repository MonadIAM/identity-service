declare namespace Fixtures {
    namespace Session {
        interface Contract extends Fixtures.Core.Contract {
            lockScenario: LockScenario.Signature;
        }

        namespace LockScenario {
            type Result = Promise<{
                external: Entities.Session;
                account: Entities.Account;
                second: Entities.Session;
                first: Entities.Session;
                third: Entities.Session;
            }>;
            type Signature = () => Result;
        }
    }
}
