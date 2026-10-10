declare namespace Services.ServiceClient {
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
    namespace ApplyRealmRevocation {
        type Props = {
            transaction: ORM.EntityManager;
            version: number;
            realm: string;
        };

        type Result = Promise<Entities.ServiceClient[]>;

        type Signature = (props: Props) => Result;
    }

    namespace ApplyRealmRestore {
        type Props = {
            transaction: ORM.EntityManager;
            version: number;
            realm: string;
        };

        type Result = Promise<Entities.ServiceClient[]>;

        type Signature = (props: Props) => Result;
    }

    namespace PurgeRealm {
        type Props = {
            transaction: ORM.EntityManager;
            version: number;
            realm: string;
        };

        type Result = Promise<Entities.ServiceClient[]>;

        type Signature = (props: Props) => Result;
    }
}
