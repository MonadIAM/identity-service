declare namespace Entities {
    type Application = Application.Contract;

    namespace Application {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            description?: string;
            realm: string;
            name: string;

            realmVersion: number;
            isSystemManaged: boolean;
            isRealmRevoked: boolean;
            isRevoked: boolean;

            interfaceClients: ORM.Collection<Entities.InterfaceClient>;
            serviceClients: ORM.Collection<Entities.ServiceClient>;

            applyRealmRevocation(version: number): void;
            applyRealmRestore(version: number): void;
            update(patch: ChangeDataProps): void;
            canPurge(): void;
            restore(): void;
            revoke(): void;
        }

        type ConstructorProps = {
            realm: string;
            name: string;
            description?: string;
            isRevoked?: boolean;
            isRealmRevoked?: boolean;
            isSystemManaged?: boolean;
            realmVersion?: number;
        };

        type ChangeDataProps = {
            description?: string;
            name?: string;
        };
    }
}
