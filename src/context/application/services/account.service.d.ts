import { EntityManager } from "@mikro-orm/postgresql";

import { AccountStatus, AccountSubject } from "~context/enums";

declare global {
    namespace Services {
        namespace Account {
            interface Contract {
                deactivate(props: Deactivate.Props): Deactivate.Result;
                unsuspend(props: Unsuspend.Props): Unsuspend.Result;
                suspend(props: Suspend.Props): Suspend.Result;
                restore(props: Restore.Props): Restore.Result;
                create(props: Create.Props): Create.Result;
                verify(props: Verify.Props): Verify.Result;
                purge(props: Purge.Props): Purge.Result;
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

            namespace Deactivate {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        sessions: Entities.Session[];
                        account: Entities.Account;
                    };
                };

                type Result = void;
            }

            namespace Suspend {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        sessions: Entities.Session[];
                        account: Entities.Account;
                    };
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        account: Entities.Account;
                        reason?: string;
                    };
                };

                type Result = void;
            }

            namespace Verify {
                type Props = {
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = void;
            }

            namespace Unsuspend {
                type Props = {
                    input: {
                        account: Entities.Account;
                        reason?: string;
                    };
                };

                type Result = void;
            }

            namespace Restore {
                type Props = {
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = void;
            }
        }
    }
}
