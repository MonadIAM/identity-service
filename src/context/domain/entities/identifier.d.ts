import { IdentifierType } from "~context/enums";

declare global {
    namespace Entities {
        type Identifier = Identifier.Contract;

        namespace Identifier {
            interface Contract {
                id: string;
                createdAt: Date;
                verifiedAt?: Date;
                lastUsedAt?: Date;

                type: IdentifierType;
                value: string;

                providerUserId?: string;
                provider?: string;

                isVerified: boolean;
                isPublicContact: boolean;

                account: Entities.Account;

                togglePublicContact(): void;
                verify(): void;
            }

            type ConstructorProps = {
                account: Entities.Account;
                type: IdentifierType;
                value: string;
                providerUserId?: string;
                isVerified?: boolean;
                provider?: string;
            };
        }
    }
}
