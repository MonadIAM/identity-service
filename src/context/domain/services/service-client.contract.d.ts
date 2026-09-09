declare namespace Services {
    namespace ServiceClient {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.ServiceClient[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
                input: {
                    allowedAddresses?: string[];
                    description?: string;
                    application: string;
                    code: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.ServiceClient>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                transaction: ORM.EntityManager;
                patch: {
                    allowedAddresses?: string[];
                    description?: string;
                    name?: string;
                };
                realm: string;
                id: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.ServiceClient[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.ServiceClient[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
