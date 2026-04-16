import { EntityManager } from "@mikro-orm/postgresql";

import { SecondFactor as SecondFactorEntity, Account as AccountEntity } from "~context/domain/entities";
import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract {
                create: (props: Create.Props) => Create.Result;
                verify: (props: Verify) => void;
                purge: (props: Purge) => void;
                reset: (props: Reset) => void;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        account: AccountEntity;
                        type: SecondFactorType;
                        secret: string;
                        name: string;
                    };
                };

                type Result = SecondFactorEntity;
            }

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
