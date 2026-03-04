import { AccountSubject, AccountStatus, IdentifierType, NotificationCategory, SecondFactorType } from "~context/enums";

import { Account as AccountEntity } from "./account.entity";

declare global {
    namespace Entities {
        namespace Account {
            type ConstructorProps = {
                subject: AccountSubject;
                status: AccountStatus;
            };
        }

        namespace Identifier {
            type ConstructorProps = {
                primaryOfAccount: AccountEntity;
                account: AccountEntity;
                type: IdentifierType;
                value: string;
            };
        }

        namespace MasterCode {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        namespace Notification {
            type ConstructorProps = {
                category: NotificationCategory;
                account: AccountEntity;
                source: string;
                title: string;
                type: string;
                body: string;
            };
        }

        namespace PasswordHistory {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        namespace Password {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        namespace Profile {
            type ConstructorProps = {
                account: AccountEntity;
                displayName: string;
                timeZone: string;
                locale: string;
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
                isPreferred: boolean;
                secret: string;
                name: string;
            };
        }

        namespace Session {
            type ConstructorProps = {
                refreshTokenHash: string;
                account: AccountEntity;
                userAgent: string;
                expiresAt: Date;
                ip: string;
            };
        }
    }
}
