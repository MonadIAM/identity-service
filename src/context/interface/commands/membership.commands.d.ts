declare namespace Commands {
    namespace Membership {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            revoke: Revoke.Signature;
            grant: Grant.Signature;
        }

        namespace Revoke {
            type Props = {
                input: {
                    account: string;
                    realm: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Grant {
            type Props = {
                input: {
                    invitedBy: string;
                    account: string;
                    joinedAt: Date;
                    realm: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
