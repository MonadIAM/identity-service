import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Session {
            interface Contract {
                create: (props: Create.Props) => Promise<Create.Result>;
                purge: (props: Purge) => void;
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

                type Result = {
                    accessToken: string;
                    refreshToken: string;
                };
            }

            type Purge = {
                transaction: EntityManager;
                input: {
                    sessions: Entities.Session[];
                };
            };
        }
    }
}
