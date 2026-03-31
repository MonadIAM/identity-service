import { EntityManager } from "@mikro-orm/postgresql";

import { Account as AccountEntity, Session as SessionEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Session {
            interface Contract {
                forceLogout: (props: ForceLogout) => void;
                revokeAll: (props: RevokeAll) => void;
                resolveSessionExpiry: () => Date;
                create: (props: Create) => void;
                revoke: (props: Revoke) => void;
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
                input: {
                    session: SessionEntity;
                };
            };

            type RevokeAll = {
                transaction: EntityManager;
                input: {
                    account: AccountEntity;
                };
            };

            type ForceLogout = {
                transaction: EntityManager;
                input: {
                    account: AccountEntity;
                    reason: string;
                    actor: string;
                };
            };
        }
    }
}
