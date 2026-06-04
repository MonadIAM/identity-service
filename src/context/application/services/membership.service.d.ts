import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Membership {
            interface Contract {
                create: (props: Create.Props) => Create.Result;
                revoke: (props: Revoke.Props) => Revoke.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
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
                    transaction: EntityManager;
                    input: {
                        account: string;
                        realm: string;
                    };
                };

                type Result = Promise<void>;
            }
        }
    }
}
