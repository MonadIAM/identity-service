declare namespace Fixtures {
    namespace InterfaceClient {
        interface Contract extends Fixtures.Core.Contract {
            limitScenario: LimitScenario.Signature;
        }

        namespace LimitScenario {
            type Result = Promise<{
                fullApplication: Entities.Application;
                availableApplication: Entities.Application;
            }>;

            type Signature = () => Result;
        }
    }
}
