import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Password {
            interface Contract {
                rotate(props: Rotate.Props): Rotate.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            namespace Rotate {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        password: Entities.Password;
                        newHash: string;
                    };
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        entries: Entities.PasswordHistory[];
                    };
                };

                type Result = void;
            }
        }
    }
}
