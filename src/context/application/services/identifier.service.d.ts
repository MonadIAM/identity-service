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
                context: RequestContext;
                input: {
                    identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                    account: AccountEntity;
                };
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: IdentifierEntity;
                    reason?: string;
                };
            };

            type Verify = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: IdentifierEntity;
                };
            };

            type SetPrimary = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: IdentifierEntity;
                };
            };

            type ToggleNotifications = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: IdentifierEntity;
                };
            };

            type TogglePasswordlessLogin = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: IdentifierEntity;
                };
            };
        }
    }
}
