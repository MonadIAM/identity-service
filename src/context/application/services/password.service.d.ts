import { EntityManager } from "@mikro-orm/postgresql";

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
                    password: Entities.Password;
                    newHash: string;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entries: Entities.PasswordHistory[];
                };
            };
        }
    }
}
