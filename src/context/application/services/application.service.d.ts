declare namespace Services {
    namespace Application {
        interface Contract extends CommandContract {}

        interface CommandContract {
            applyRealmRevocation: ApplyRealmRevocation.Signature;
            applyRealmRestore: ApplyRealmRestore.Signature;
            purgeRealm: PurgeRealm.Signature;
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace ApplyRealmRevocation {
            type Props = {
                entities: Entities.Application[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace ApplyRealmRestore {
            type Props = {
                entities: Entities.Application[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace PurgeRealm {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.Application[];
                version: number;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Restore {
            type Props = {
                entities: Entities.Application[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    description?: string;
                    realm: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.Application>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                entity: Entities.Application;
                patch: {
                    description?: string;
                    name?: string;
                };
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.Application[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.Application[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
