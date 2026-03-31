import { EntityManager } from "@mikro-orm/postgresql";

import { Identifier as IdentifierEntity, Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Identifier {
            interface Contract {
                togglePasswordlessLogin: (props: TogglePasswordlessLogin) => void;
                toggleNotifications: (props: ToggleNotifications) => void;
                create: (props: Create) => IdentifierEntity;
                setPrimary: (props: SetPrimary) => void;
                verify: (props: Verify) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                    account: AccountEntity;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    identifier: IdentifierEntity;
                    reason?: string;
                };
            };

            type Verify = {
                transaction: EntityManager;
                input: {
                    identifier: IdentifierEntity;
                };
            };

            type SetPrimary = {
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

            type TogglePasswordlessLogin = {
                input: {
                    identifier: IdentifierEntity;
                };
            };
        }
    }
}
