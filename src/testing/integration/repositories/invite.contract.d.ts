declare namespace Fixtures {
    namespace Invite {
        interface Contract extends Fixtures.Core.Contract {
            cancelledScenario: CancelledScenario.Signature;
            pendingScenario: PendingScenario.Signature;
        }

        namespace PendingScenario {
            type Result = Promise<{
                inviter: Entities.Account;
                invitee: Entities.Account;
                pending: Entities.Invite;
                realm: string;
            }>;

            type Signature = () => Result;
        }

        namespace CancelledScenario {
            type Result = Promise<{
                cancelled: Entities.Invite;
                inviter: Entities.Account;
                invitee: Entities.Account;
                realm: string;
            }>;

            type Signature = () => Result;
        }
    }
}
