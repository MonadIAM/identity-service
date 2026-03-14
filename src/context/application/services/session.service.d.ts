import { EntityManager } from "@mikro-orm/postgresql";

import { Account as AccountEntity, Session as SessionEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Session {
            interface Contract {
                create: (props: Create) => Promise<SessionEntity>;
                revoke: (props: Revoke) => Promise<void>;
                revokeAll: (props: RevokeAll) => Promise<void>;
                forceLogout: (props: ForceLogout) => Promise<void>;
                refresh: (props: Refresh) => Promise<void>;
                resolveSessionExpiry: () => Date;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                    session: SessionEntity;
                };
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    session: SessionEntity;
                };
            };

            type RevokeAll = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                };
            };

            type ForceLogout = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                    reason: string;
                    actor: string;
                };
            };

            type Refresh = {
                transaction: EntityManager;
                input: {
                    session: SessionEntity;
                    hash: string;
                };
            };
        }
    }
}
