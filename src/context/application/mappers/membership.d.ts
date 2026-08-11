declare namespace Commands {
    namespace Mappers {
        namespace Membership {
            interface Contract extends PublicContract {}

            interface PublicContract {
                leaveRequestedPayload: LeaveRequestedPayload.Signature;
            }

            namespace LeaveRequestedPayload {
                type Props = Commands.Membership.Exclude.ExecuteResult;

                type Result = Topics.Membership.LeaveRequestedMessage["payload"];

                type Signature = (props: Props) => Result;
            }
        }
    }
}
