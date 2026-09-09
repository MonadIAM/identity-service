declare namespace Services {
    namespace Application {
        interface Contract extends InternalContract, CommandContract {}

        interface InternalContract {
            cascadeRevocation: CascadeRevocation.Signature;
            cascadeRestore: CascadeRestore.Signature;
        }

        namespace CascadeRevocation {
            type Props = {
                entities: Entities.Application[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace CascadeRestore {
            type Props = {
                entities: Entities.Application[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

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
                transaction: ORM.EntityManager;
                version: number;
                realm: string;
            };

            type Result = Promise<Entities.Application[]>;

            type Signature = (props: Props) => Result;
        }

        namespace ApplyRealmRestore {
            type Props = {
                transaction: ORM.EntityManager;
                version: number;
                realm: string;
            };

            type Result = Promise<Entities.Application[]>;

            type Signature = (props: Props) => Result;
        }

        namespace PurgeRealm {
            type Props = {
                transaction: ORM.EntityManager;
                version: number;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Restore {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.Application[]>;

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
                transaction: ORM.EntityManager;
                patch: {
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

            type Result = Promise<Entities.Application[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.Application[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
