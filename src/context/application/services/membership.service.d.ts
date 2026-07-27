declare namespace Services {
    namespace Membership {
        interface Contract {
            create(props: Create.Props): Create.Result;
            revoke(props: Revoke.Props): Revoke.Result;
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
        }
    }
}
