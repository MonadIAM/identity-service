import { EntityManager } from "@mikro-orm/postgresql";

import { AccountStatus, AccountSubject } from "~context/enums";

declare global {
    namespace Services {
        namespace Account {
            interface Contract {
                create: (props: Create.Props) => Create.Result;
                deactivate: (props: Deactivate) => void;
                unsuspend: (props: Unsuspend) => void;
                suspend: (props: Suspend) => void;
                restore: (props: Restore) => void;
                verify: (props: Verify) => void;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        additionalIdentifier?: Omit<Entities.Identifier.ConstructorProps, "account">;
                        primaryIdentifier: Omit<Entities.Identifier.ConstructorProps, "account">;
                        profile: Omit<Entities.Profile.ConstructorProps, "account">;
                        subject: AccountSubject;
                        status: AccountStatus;
                        password?: string;
                    };
                };

                type Result = Entities.Account;
            }

            type Deactivate = {
                transaction: EntityManager;
                input: {
                    sessions: Entities.Session[];
                    account: Entities.Account;
                };
            };

            type Suspend = {
                transaction: EntityManager;
                input: {
                    sessions: Entities.Session[];
                    account: Entities.Account;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    account: Entities.Account;
                    reason?: string;
                };
            };

            type Verify = {
                input: {
                    account: Entities.Account;
                };
            };

            type Unsuspend = {
                input: {
                    account: Entities.Account;
                    reason?: string;
                };
            };

            type Restore = {
                input: {
                    account: Entities.Account;
                };
            };
        }
    }
}
