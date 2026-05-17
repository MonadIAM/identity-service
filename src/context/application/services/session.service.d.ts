import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Session {
            interface Contract {
                create: (props: Create.Props) => Create.Result;
                purge: (props: Purge.Props) => Purge.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        account: Entities.Account;
                        userAgent: string;
                        ip: string;
                    };
                };

                type Result = Promise<{
                    refreshToken: string;
                    accessToken: string;
                }>;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        sessions: Entities.Session[];
                    };
                };

                type Result = void;
            }
        }
    }
}
