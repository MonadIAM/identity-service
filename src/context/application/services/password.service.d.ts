import { EntityManager } from "@mikro-orm/postgresql";

import { PasswordHistory as PasswordHistoryEntity, Password as PasswordEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Password {
            interface Contract {
                rotate: (props: Rotate) => void;
                purge: (props: Purge) => void;
            }

            type Rotate = {
                transaction: EntityManager;
                input: {
                    password: PasswordEntity;
                    newHash: string;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entries: PasswordHistoryEntity[];
                };
            };
        }
    }
}
