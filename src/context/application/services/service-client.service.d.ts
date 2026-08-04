declare namespace Services {
    namespace ServiceClient {
        interface Contract extends CommandContract {}

        interface CommandContract {
            applyApplicationRevocation: ApplyApplicationRevocation.Signature;
            applyApplicationRestore: ApplyApplicationRestore.Signature;
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace ApplyApplicationRevocation {
            type Props = {
                entities: Entities.ServiceClient[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace ApplyApplicationRestore {
            type Props = {
                entities: Entities.ServiceClient[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Restore {
            type Props = {
                entities: Entities.ServiceClient[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    allowedAddresses?: string[];
                    description?: string;
                    application: Entities.Application;
                    code: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.ServiceClient>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                entity: Entities.ServiceClient;
                patch: {
                    allowedAddresses?: string[];
                    description?: string;
                    name?: string;
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.ServiceClient[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.ServiceClient[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
