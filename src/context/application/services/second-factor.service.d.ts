import { EntityManager } from "@mikro-orm/postgresql";

import { SecondFactor as SecondFactorEntity, Account as AccountEntity } from "~context/domain/entities";
import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract {
                confirm: (props: Confirm) => void;
                remove: (props: Remove) => void;
                enableEnforce: (props: EnableEnforce) => void;
                disableEnforce: (props: DisableEnforce) => void;
                resetByMasterCode: (props: ResetByMasterCode) => void;
            }

            type Confirm = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    masterCodeHash: string;
                    account: AccountEntity;
                    type: SecondFactorType;
                    secret: string;
                    name: string;
                };
            };

            type Remove = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    factor: SecondFactorEntity;
                    reason: string;
                };
            };

            type EnableEnforce = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    account: AccountEntity;
                };
            };

            type DisableEnforce = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
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
