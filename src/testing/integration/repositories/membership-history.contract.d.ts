declare namespace Fixtures {
    namespace MembershipHistory {
        interface Contract extends Fixtures.Core.Contract {
            closedPeriodScenario: ClosedPeriodScenario.Signature;
            openPeriodScenario: OpenPeriodScenario.Signature;
        }

        namespace OpenPeriodScenario {
            type Result = Promise<{
                open: Entities.MembershipHistory;
                account: string;
                realm: string;
            }>;

            type Signature = () => Result;
        }

        namespace ClosedPeriodScenario {
            type Result = Promise<{
                closed: Entities.MembershipHistory;
                account: string;
                realm: string;
            }>;

            type Signature = () => Result;
        }
    }
}
