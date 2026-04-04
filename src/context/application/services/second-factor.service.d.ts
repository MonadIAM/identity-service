import { EntityManager } from "@mikro-orm/postgresql";

import { SecondFactor as SecondFactorEntity, Account as AccountEntity } from "~context/domain/entities";
import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract {
                create: (props: Create) => SecondFactorEntity;
                confirm: (props: Confirm) => void;
                revoke: (props: Revoke) => void;
                restore: (props: Restore) => void;
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

            type Confirm = {
                transaction: EntityManager;
                input: {
                    factor: SecondFactorEntity;
                    masterCodeHash: string;
                };
            };

            type Revoke = {
                input: {
                    factor: SecondFactorEntity;
                };
            };

            type Restore = {
                input: {
                    factor: SecondFactorEntity;
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
