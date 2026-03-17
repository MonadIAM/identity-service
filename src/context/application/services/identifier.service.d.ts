import { EntityManager } from "@mikro-orm/postgresql";

import { Identifier as IdentifierEntity, Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Identifier {
            interface Contract {
                create: (props: Create) => Promise<IdentifierEntity>;
                purge: (props: Purge) => Promise<void>;
                verify: (props: Verify) => Promise<void>;
                setPrimary: (props: SetPrimary) => Promise<void>;
                toggleNotifications: (props: ToggleNotifications) => Promise<void>;
                togglePasswordlessLogin: (props: TogglePasswordlessLogin) => Promise<void>;
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
