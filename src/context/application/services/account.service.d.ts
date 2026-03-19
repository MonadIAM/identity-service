import { EntityManager } from "@mikro-orm/postgresql";

import { Account as AccountEntity } from "~context/domain/entities";
import { AccountSubject } from "~context/enums";

declare global {
    namespace Services {
        namespace Account {
            interface Contract {
                createByOAuth: (props: CreateByOAuth) => AccountEntity;
                create: (props: Create) => AccountEntity;
                deactivate: (props: Deactivate) => void;
                unsuspend: (props: Unsuspend) => void;
                suspend: (props: Suspend) => void;
                restore: (props: Restore) => void;
                verify: (props: Verify) => void;
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
                    account: AccountEntity;
                };
            };

            type Deactivate = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                    reason?: string;
                };
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                };
            };

            type Suspend = {
                transaction: EntityManager;
                context: RequestContext;
                actor: string;
                input: {
                    account: AccountEntity;
                    reason?: string;
                };
            };

            type Unsuspend = {
                transaction: EntityManager;
                context: RequestContext;
                actor: string;
                input: {
                    account: AccountEntity;
                    reason?: string;
                };
            };
        }
    }
}
