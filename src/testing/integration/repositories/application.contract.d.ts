declare namespace Fixtures {
    namespace Application {
        interface Contract extends Fixtures.Core.Contract {
            limitScenario: LimitScenario.Signature;
        }

        namespace LimitScenario {
            type Result = Promise<{
                availableRealm: string;
                fullRealm: string;
            }>;

            type Signature = () => Result;
        }
    }
}
