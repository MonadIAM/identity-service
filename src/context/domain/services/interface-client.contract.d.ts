declare namespace Services {
    namespace InterfaceClient {
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
                entities: Entities.InterfaceClient[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace ApplyApplicationRestore {
            type Props = {
                entities: Entities.InterfaceClient[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Restore {
            type Props = {
                entities: Entities.InterfaceClient[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    description?: string;
                    application: Entities.Application;
                    redirectUris: string[];
                    authAddress: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.InterfaceClient>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                entity: Entities.InterfaceClient;
                patch: {
                    redirectUris?: string[];
                    authAddress?: string;
                    description?: string;
                    name?: string;
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.InterfaceClient[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.InterfaceClient[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
