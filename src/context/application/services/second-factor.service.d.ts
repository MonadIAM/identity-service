import { EntityManager } from "@mikro-orm/postgresql";

import { SecondFactor as SecondFactorEntity, Account as AccountEntity } from "~context/domain/entities";
import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract {
                create: (props: Create) => SecondFactorEntity;
                verify: (props: Verify) => void;
                purge: (props: Purge) => void;
                reset: (props: Reset) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    account: AccountEntity;
                    type: SecondFactorType;
                    secret: string;
                    name: string;
                };
            };

            type Verify = {
                transaction: EntityManager;
                input: {
                    factor: SecondFactorEntity;
                    masterCodeHash: string;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    factor: SecondFactorEntity;
                };
            };

            type Reset = {
                transaction: EntityManager;
                input: {
                    account: AccountEntity;
                };
            };
        }
    }
}
