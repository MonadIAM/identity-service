import { EntityManager } from "@mikro-orm/postgresql";

import { Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace RecoveryCode {
            interface Contract {
                generate: (props: Generate) => Promise<void>;
            }

            type Generate = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                    hashes: string[];
                };
            };
        }
    }
}
