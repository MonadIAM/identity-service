import { EntityManager } from "@mikro-orm/postgresql";

import { Session as SessionEntity, Account as AccountEntity } from "~context/domain/entities";

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
                        account: AccountEntity;
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
                    sessions: SessionEntity[];
                };
            };
        }
    }
}
