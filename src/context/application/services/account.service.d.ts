import { EntityManager } from "@mikro-orm/postgresql";

import { Session as SessionEntity, Account as AccountEntity } from "~context/domain/entities";
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

                type Result = AccountEntity;
            }

            type Deactivate = {
                transaction: EntityManager;
                input: {
                    sessions: SessionEntity[];
                    account: AccountEntity;
                };
            };

            type Suspend = {
                transaction: EntityManager;
                input: {
                    sessions: SessionEntity[];
                    account: AccountEntity;
                };
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    account: AccountEntity;
                    reason?: string;
                };
            };

            type Verify = {
                input: {
                    account: AccountEntity;
                };
            };

            type Unsuspend = {
                input: {
                    account: AccountEntity;
                    reason?: string;
                };
            };

            type Restore = {
                input: {
                    account: AccountEntity;
                };
            };
        }
    }
}
