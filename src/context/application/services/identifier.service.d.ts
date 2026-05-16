import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Identifier {
            interface Contract {
                toggleNotifications: (props: ToggleNotifications) => void;
                togglePublicContact: (props: TogglePublicContact) => void;
                create: (props: Create.Props) => Create.Result;
                purge: (props: Purge) => Promise<void>;
                verify: (props: Verify) => void;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                        account: Entities.Account;
                    };
                };

                type Result = Entities.Identifier;
            }

            type Purge = {
                transaction: EntityManager;
                input: {
                    identifier: Entities.Identifier;
                    account: string;
                    reason?: string;
                };
            };

            type Verify = {
                transaction: EntityManager;
                input: {
                    identifier: Entities.Identifier;
                };
            };

            type ToggleNotifications = {
                input: {
                    identifier: Entities.Identifier;
                };
            };

            type TogglePublicContact = {
                input: {
                    identifier: Entities.Identifier;
                };
            };
        }
    }
}
