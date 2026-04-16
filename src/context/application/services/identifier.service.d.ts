import { EntityManager } from "@mikro-orm/postgresql";

import { Identifier as IdentifierEntity, Account as AccountEntity } from "~context/domain/entities";

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
                        account: AccountEntity;
                    };
                };

                type Result = IdentifierEntity;
            }

            type Purge = {
                transaction: EntityManager;
                input: {
                    identifier: IdentifierEntity;
                    account: string;
                    reason?: string;
                };
            };

            type Verify = {
                transaction: EntityManager;
                input: {
                    identifier: IdentifierEntity;
                };
            };

            type ToggleNotifications = {
                input: {
                    identifier: IdentifierEntity;
                };
            };

            type TogglePublicContact = {
                input: {
                    identifier: IdentifierEntity;
                };
            };
        }
    }
}
