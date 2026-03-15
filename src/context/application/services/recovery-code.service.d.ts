import { EntityManager } from "@mikro-orm/postgresql";

import { Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace RecoveryCode {
            interface Contract {
                regenerate: (props: Regenerate) => Promise<void>;
                generate: (props: Generate) => Promise<void>;
            }

            type Regenerate = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                    hashes: string[];
                };
            };

            type Generate = {
                transaction: EntityManager;
                input: {
                    account: AccountEntity;
                    hashes: string[];
                };
            };
        }
    }
}
