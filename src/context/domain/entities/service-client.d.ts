declare namespace Entities {
    type ServiceClient = ServiceClient.Contract;

    namespace ServiceClient {
        interface Contract {
            id: string;
            createdAt: Date;
            updatedAt?: Date;
            version: number;

            code: string;
            name: string;
            application: Entities.Application;
            description?: string;
            allowedAddresses: string[];

            applicationVersion: number;
            isSystemManaged: boolean;
            isApplicationRevoked: boolean;
            isRevoked: boolean;

            applyApplicationRevocation(version: number): void;
            applyApplicationRestore(version: number): void;
            update(patch: ChangeDataProps): void;
            canPurge(): void;
            restore(): void;
            revoke(): void;
        }

        type ConstructorProps = {
            code: string;
            name: string;
            application: Entities.Application;
            isRevoked?: boolean;
            description?: string;
            isSystemManaged?: boolean;
            allowedAddresses?: string[];
            applicationVersion?: number;
            isApplicationRevoked?: boolean;
        };

        type ChangeDataProps = {
            description?: string;
            name?: string;
            allowedAddresses?: string[];
        };
    }
}
