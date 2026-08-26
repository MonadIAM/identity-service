declare namespace Commands {
    namespace Membership {
        interface Contract extends ControllerContract, ConsumerContract {}

        interface ControllerContract {
            exclude: Exclude.Signature;
        }

        namespace Exclude {
            type Props = {
                actor: string;
                realm: string;
                input: {
                    account: string;
                    reason: string;
                };
                context: Extract.Meta;
            };

            type ExecuteResult = {
                actor: string;
                realm: string;
                input: {
                    account: string;
                    reason: string;
                };
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        interface ConsumerContract {
            confirm: Confirm.Signature;
            reject: Reject.Signature;
        }

        namespace Confirm {
            type Props = {
                input:
                    | Topics.Membership.JoinConfirmedMessage["payload"]["input"]
                    | Topics.Membership.LeaveConfirmedMessage["payload"]["input"];
                context: Extract.Meta;
                actor: string;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Reject {
            type Props = {
                input: Topics.Membership.JoinRejectedMessage["payload"]["input"];
                context: Extract.Meta;
                actor: string;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
