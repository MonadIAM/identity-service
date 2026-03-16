import { EntityManager } from "@mikro-orm/postgresql";

import { Account as AccountEntity } from "~context/domain/entities";
import { AccountSubject } from "~context/enums";

declare global {
    namespace Services {
        namespace Account {
            interface Contract {
                create: (props: Create) => Promise<AccountEntity>;
                createByOAuth: (props: CreateByOAuth) => Promise<AccountEntity>;
                verify: (props: Verify) => Promise<void>;
                deactivate: (props: Deactivate) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
                suspend: (props: Suspend) => Promise<void>;
                unsuspend: (props: Unsuspend) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    identifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                    subject: AccountSubject;
                    displayName: string;
                    password: string;
                };
            };

            type CreateByOAuth = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    oauth: Omit<Entities.Identifier.ConstructorProps, "account">;
                    email?: Omit<Entities.Identifier.ConstructorProps, "account">;
                    profile: Omit<Entities.Profile.ConstructorProps, "account">;
                    subject: AccountSubject;
                };
            };

            type Verify = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entity: AccountEntity;
                };
            };

            type Deactivate = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entity: AccountEntity;
                    reason?: string;
                };
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entity: AccountEntity;
                };
            };

            type Suspend = {
                transaction: EntityManager;
                context: RequestContext;
                actor: string;
                input: {
                    entity: AccountEntity;
                    reason?: string;
                };
            };

            type Unsuspend = {
                transaction: EntityManager;
                context: RequestContext;
                actor: string;
                input: {
                    entity: AccountEntity;
                    reason?: string;
                };
            };
        }
    }
}
