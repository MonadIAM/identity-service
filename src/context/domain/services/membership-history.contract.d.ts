declare namespace Services {
    namespace MembershipHistory {
        interface Contract extends CommandContract {}

        interface CommandContract {
            create: Create.Signature;
            close: Close.Signature;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                    invitedBy: string;
                    joinedAt: Date;
                    realm: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Close {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                    excludedBy: string;
                    realm: string;
                };
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }
    }
}
