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

                realm: string;
                name: string;
                description?: string;

                authAddress: string;
                redirectUris: string[];
                grantTypes: TokenGrantType[];

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

                authAddress: string;
                redirectUris: string[];
                grantTypes: TokenGrantType[];

                realmVersion?: number;
                isSystemManaged?: boolean;
                isRealmRevoked?: boolean;
                isRevoked?: boolean;
            };

            type ChangeDataProps = {
                name?: string;
                description?: string;

                authAddress?: string;
                redirectUris?: string[];
            };
        }
    }
}
