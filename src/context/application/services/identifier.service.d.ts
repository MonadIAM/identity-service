import { EntityManager } from "@mikro-orm/postgresql";

import { Identifier as IdentifierEntity, Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Identifier {
            interface Contract {
                add: (props: Add) => Promise<IdentifierEntity>;
                remove: (props: Remove) => Promise<void>;
                verify: (props: Verify) => Promise<void>;
                setPrimary: (props: SetPrimary) => Promise<void>;
                toggleNotifications: (props: ToggleNotifications) => Promise<void>;
                togglePasswordlessLogin: (props: TogglePasswordlessLogin) => Promise<void>;
            }

            type Add = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                    account: AccountEntity;
                };
            };

            type Remove = {
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
