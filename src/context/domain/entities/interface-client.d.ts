import { TokenGrantType } from "~context/enums";

declare global {
    namespace Entities {
        type InterfaceClient = InterfaceClient.Contract;

        namespace InterfaceClient {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                name: string;
                application: Entities.Application;
                redirectUris: string[];
                authAddress: string;
                grantTypes: TokenGrantType[];
                description?: string;

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
                name: string;
                redirectUris: string[];
                authAddress: string;
                grantTypes: TokenGrantType[];
                application: Entities.Application;
                description?: string;
                isRevoked?: boolean;
                isSystemManaged?: boolean;
                applicationVersion?: number;
                isApplicationRevoked?: boolean;
            };

            type ChangeDataProps = {
                redirectUris?: string[];
                authAddress?: string;
                description?: string;
                name?: string;
            };
        }
    }
}
