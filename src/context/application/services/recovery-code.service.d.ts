import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace RecoveryCode {
            interface Contract {
                regenerate: (props: Regenerate) => void;
                generate: (props: Generate) => void;
            }

            type Regenerate = {
                transaction: EntityManager;
                input: {
                    account: Entities.Account;
                    hashes: string[];
                };
            };

            type Generate = {
                transaction: EntityManager;
                input: {
                    account: Entities.Account;
                    hashes: string[];
                };
            };
        }
    }
}
