import { EntityManager } from "@mikro-orm/postgresql";

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
                        account: Entities.Account;
                        type: SecondFactorType;
                        secret: string;
                        name: string;
                    };
                };

                type Result = Entities.SecondFactor;
            }

            type Verify = {
                transaction: EntityManager;
                input: {
                    factor: Entities.SecondFactor;
                    masterCodeHash: string;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    factor: Entities.SecondFactor;
                };
            };

            type Reset = {
                transaction: EntityManager;
                input: {
                    account: Entities.Account;
                };
            };
        }
    }
}
