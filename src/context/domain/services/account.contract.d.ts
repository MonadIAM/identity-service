import { AccountStatus, AccountSubject } from "~context/enums";

declare global {
    namespace Services {
        namespace Account {
            interface Contract extends CommandContract {}

            interface CommandContract {
                deactivate: Deactivate.Signature;
                unsuspend: Unsuspend.Signature;
                suspend: Suspend.Signature;
                restore: Restore.Signature;
                create: Create.Signature;
                verify: Verify.Signature;
                purge: Purge.Signature;
            }

            namespace Deactivate {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        sessions: Entities.Session[];
                        account: Entities.Account;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Unsuspend {
                type Props = {
                    input: {
                        account: Entities.Account;
                        reason?: string;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Restore {
                type Props = {
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Suspend {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        sessions: Entities.Session[];
                        account: Entities.Account;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = {
                    transaction: ORM.EntityManager;
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

                type Signature = (props: Props) => Result;
            }

            namespace Verify {
                type Props = {
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        account: Entities.Account;
                        reason?: string;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
