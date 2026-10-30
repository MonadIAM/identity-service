import { AccountStatus, AccountSubject } from "~context/enums";

declare global {
    namespace Services.Account {
        interface Contract extends CommandContract {}

        interface CommandContract {
            deactivate: Deactivate.Signature;
            unsuspend: Unsuspend.Signature;
            suspend: Suspend.Signature;
            create: Create.Signature;
            verify: Verify.Signature;
        }

        namespace Deactivate {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                };
            };

            type Result = Promise<Entities.Session[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Unsuspend {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                    reason?: string;
                };
            };

            type Result = Promise<Entities.Account>;

            type Signature = (props: Props) => Result;
        }

        namespace Suspend {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                };
            };

            type Result = Promise<Entities.Account>;

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
                transaction: ORM.EntityManager;
                input: {
                    account: string;
                };
            };

            type Result = Promise<Entities.Account>;

            type Signature = (props: Props) => Result;
        }
    }
}
