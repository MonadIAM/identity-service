import { SecondFactorType, AccountSubject, IdentifierType, AccountStatus } from "~context/enums";

import { Identifier as IdentifierEntity } from "./identifier.entity";
import { Password as PasswordEntity } from "./password.entity";
import { Account as AccountEntity } from "./account.entity";
import { Profile as ProfileEntity } from "./profile.entity";

declare global {
    namespace Entities {
        namespace Account {
            type ConstructorProps = {
                subject: AccountSubject;
                status: AccountStatus;
            };

            type AssignRelations = {
                identifier: IdentifierEntity;
                password?: PasswordEntity;
                profile: ProfileEntity;
            };
        }

        namespace Identifier {
            type ConstructorProps = {
                account: AccountEntity;
                type: IdentifierType;
                value: string;
                providerUserId?: string;
                isVerified?: boolean;
                provider?: string;
            };
        }

        namespace MasterCode {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        namespace PasswordHistory {
            type ConstructorProps = {
                account: AccountEntity;
                version: number;
                hash: string;
            };
        }

        namespace Password {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };

            type Previous = {
                version: number;
                hash: string;
            };
        }

        namespace Profile {
            type ConstructorProps = {
                account: AccountEntity;
                displayName: string;
                pictureUrl?: string;
                timeZone?: string;
                locale?: string;
            };

            type ChangeDataProps = {
                displayName?: string;
                pictureUrl?: string;
                timeZone?: string;
                locale?: string;
            };
        }

        namespace RecoveryCode {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        namespace SecondFactor {
            type ConstructorProps = {
                account: AccountEntity;
                type: SecondFactorType;
                secret: string;
                name: string;
            };
        }

        namespace Session {
            type ConstructorProps = {
                account: AccountEntity;
                userAgent: string;
                expiresAt: Date;
                ip: string;
            };
        }
    }
}
