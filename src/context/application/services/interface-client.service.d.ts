declare namespace Services {
    namespace InterfaceClient {
        interface Contract {
            applyApplicationRevocation(props: ApplyApplicationRevocation.Props): ApplyApplicationRevocation.Result;
            applyApplicationRestore(props: ApplyApplicationRestore.Props): ApplyApplicationRestore.Result;
            restore(props: Restore.Props): Restore.Result;
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    description?: string;
                    application: Entities.Application;
                    redirectUri: string;
                    authAddress: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.InterfaceClient>;
        }

        namespace Update {
            type Props = {
                entity: Entities.InterfaceClient;
                patch: {
                    redirectUri?: string;
                    authAddress?: string;
                    description?: string;
                    name?: string;
                };
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.InterfaceClient[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.InterfaceClient[];
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.InterfaceClient[];
            };

            type Result = void;
        }

        namespace ApplyApplicationRevocation {
            type Props = {
                entities: Entities.InterfaceClient[];
                version: number;
            };

            type Result = void;
        }

        namespace ApplyApplicationRestore {
            type Props = {
                entities: Entities.InterfaceClient[];
                version: number;
            };

            type Result = void;
        }
    }
}
