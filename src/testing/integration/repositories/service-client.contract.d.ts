declare namespace Fixtures.ServiceClient {
    interface Contract extends Fixtures.Core.Contract {
        limitScenario: LimitScenario.Signature;
    }

    namespace LimitScenario {
        type Result = Promise<{
            fullRealm: string;
            availableRealm: string;
        }>;

        type Signature = () => Result;
    }
}
