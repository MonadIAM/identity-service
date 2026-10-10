declare namespace Entities {
    type ServiceClient = ServiceClient.Contract;

    namespace ServiceClient {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            realm: string;
            name: string;
            description?: string;

            code: string;
            allowedAddresses: string[];

            realmVersion: number;
            isSystemManaged: boolean;
            isRealmRevoked: boolean;
            isRevoked: boolean;

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

            code: string;
            allowedAddresses?: string[];

            realmVersion?: number;
            isSystemManaged?: boolean;
            isRealmRevoked?: boolean;
            isRevoked?: boolean;
        };

        type ChangeDataProps = {
            name?: string;
            description?: string;

            allowedAddresses?: string[];
        };
    }
}
