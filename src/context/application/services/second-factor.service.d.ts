import { EntityManager } from "@mikro-orm/postgresql";

import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract {
                create: (props: Create.Props) => Create.Result;
                verify: (props: Verify.Props) => Verify.Result;
                purge: (props: Purge.Props) => Purge.Result;
                reset: (props: Reset.Props) => Reset.Result;
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

            namespace Verify {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        factor: Entities.SecondFactor;
                        masterCodeHash: string;
                    };
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        factors: Entities.SecondFactor[];
                        target: string;
                    };
                };

                type Result = void;
            }

            namespace Reset {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = void;
            }
        }
    }
}
