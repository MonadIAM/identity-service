import { SecondFactorType, AccountSubject, IdentifierType, AccountStatus, TokenGrantType } from "~context/enums";

import { PasswordHistory as PasswordHistoryEntity } from "./password-history.entity";
import { InterfaceClient as InterfaceClientEntity } from "./interface-client.entity";
import { ServiceClient as ServiceClientEntity } from "./service-client.entity";
import { RecoveryCode as RecoveryCodeEntity } from "./recovery-code.entity";
import { SecondFactor as SecondFactorEntity } from "./second-factor.entity";
import { Application as ApplicationEntity } from "./application.entity";
import { MasterCode as MasterCodeEntity } from "./master-code.entity";
import { Membership as MembershipEntity } from "./membership.entity";
import { Identifier as IdentifierEntity } from "./identifier.entity";
import { Password as PasswordEntity } from "./password.entity";
import { Account as AccountEntity } from "./account.entity";
import { Profile as ProfileEntity } from "./profile.entity";
import { Session as SessionEntity } from "./session.entity";

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

        type Account = AccountEntity;

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

        type Identifier = IdentifierEntity;

        namespace MasterCode {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        type MasterCode = MasterCodeEntity;

        namespace PasswordHistory {
            type ConstructorProps = {
                account: AccountEntity;
                version: number;
                hash: string;
            };
        }

        type PasswordHistory = PasswordHistoryEntity;

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

        type Password = PasswordEntity;

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

        type Profile = ProfileEntity;

        namespace RecoveryCode {
            type ConstructorProps = {
                account: AccountEntity;
                hash: string;
            };
        }

        type RecoveryCode = RecoveryCodeEntity;

        namespace SecondFactor {
            type ConstructorProps = {
                account: AccountEntity;
                type: SecondFactorType;
                secret: string;
                name: string;
            };
        }

        type SecondFactor = SecondFactorEntity;

        namespace Session {
            type ConstructorProps = {
                account: AccountEntity;
                userAgent: string;
                realms: string[];
                expiresAt: Date;
                client: string;
                scope: string;
                acr: string;
                ip: string;
            };
        }

        type Session = SessionEntity;

        namespace Membership {
            type ConstructorProps = {
                account: AccountEntity;
                invitedBy: string;
                joinedAt: Date;
                realm: string;
            };
        }

        type Membership = MembershipEntity;

        namespace Application {
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

        type Application = ApplicationEntity;

        namespace InterfaceClient {
            type ConstructorProps = {
                name: string;
                redirectUri: string;
                authAddress: string;
                grantTypes: TokenGrantType[];
                application: ApplicationEntity;
                description?: string;
                isRevoked?: boolean;
                isSystemManaged?: boolean;
                applicationVersion?: number;
                isApplicationRevoked?: boolean;
            };

            type ChangeDataProps = {
                redirectUri?: string;
                authAddress?: string;
                description?: string;
                name?: string;
            };
        }

        type InterfaceClient = InterfaceClientEntity;

        namespace ServiceClient {
            type ConstructorProps = {
                name: string;
                clientSecretHash: string;
                application: ApplicationEntity;
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

        type ServiceClient = ServiceClientEntity;
    }
}
