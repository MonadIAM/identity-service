declare namespace Services {
    namespace ServiceClient {
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
                    allowedAddresses?: string[];
                    description?: string;
                    application: Entities.Application;
                    code: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.ServiceClient>;
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
        }

        namespace Revoke {
            type Props = {
                entities: Entities.ServiceClient[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.ServiceClient[];
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.ServiceClient[];
            };

            type Result = void;
        }

        namespace ApplyApplicationRevocation {
            type Props = {
                entities: Entities.ServiceClient[];
                version: number;
            };

            type Result = void;
        }

        namespace ApplyApplicationRestore {
            type Props = {
                entities: Entities.ServiceClient[];
                version: number;
            };

            type Result = void;
        }
    }
}
