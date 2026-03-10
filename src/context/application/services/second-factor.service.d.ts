import { EntityManager } from "@mikro-orm/postgresql";

import { SecondFactor as SecondFactorEntity, Account as AccountEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract {
                setup: (props: Setup) => Promise<SecondFactorEntity>;
                confirm: (props: Confirm) => Promise<void>;
                remove: (props: Remove) => Promise<void>;
                enableEnforce: (props: EnableEnforce) => Promise<void>;
                disableEnforce: (props: DisableEnforce) => Promise<void>;
                resetByMasterCode: (props: ResetByMasterCode) => Promise<void>;
            }

            type Setup = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    factor: Omit<Entities.SecondFactor.ConstructorProps, "account">;
                    account: AccountEntity;
                };
            };

            type Confirm = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    factor: SecondFactorEntity;
                };
            };

            type Remove = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    factor: SecondFactorEntity;
                    confirmedCount: number;
                    reason: string;
                };
            };

            type EnableEnforce = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    masterCodeHash: string;
                    account: AccountEntity;
                };
            };

            type DisableEnforce = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    masterCodeHash: string;
                    account: AccountEntity;
                };
            };

            type ResetByMasterCode = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                };
            };
        }
    }
}
