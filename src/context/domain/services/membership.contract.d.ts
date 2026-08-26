declare namespace Services {
    namespace Membership {
        interface Contract extends CommandContract {}

        interface CommandContract {
            create: Create.Signature;
            revoke: Revoke.Signature;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: Entities.Account;
                    invitedBy: string;
                    joinedAt: Date;
                    realm: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                    realm: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
