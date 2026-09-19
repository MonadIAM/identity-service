import { IdentifierType, SecondFactorType, TokenGrantType } from "~context/enums";

declare global {
    namespace Fixtures {
        namespace Core {
            interface Contract {
                createInterfaceClient: CreateInterfaceClient.Signature;
                createPasswordHistory: CreatePasswordHistory.Signature;
                createServiceClient: CreateServiceClient.Signature;
                createRecoveryCode: CreateRecoveryCode.Signature;
                createSecondFactor: CreateSecondFactor.Signature;
                createIdentifier: CreateIdentifier.Signature;
                createMasterCode: CreateMasterCode.Signature;
                createChangeLog: CreateChangeLog.Signature;
                createAuditLog: CreateAuditLog.Signature;
                createPassword: CreatePassword.Signature;
                createProfile: CreateProfile.Signature;
                createSession: CreateSession.Signature;
                createAccount: CreateAccount.Signature;
            }

            namespace CreateAccount {
                type Props = Partial<Entities.Account.ConstructorProps> & {
                    is2FAEnforced?: boolean;
                    lastActiveAt?: Date;
                    createdAt?: Date;
                    updatedAt?: Date;
                };

                type Result = Promise<Entities.Account>;

                type Signature = (props?: Props) => Result;
            }

            namespace CreateProfile {
                type Props = Omit<Partial<Entities.Profile.ConstructorProps>, "account"> & {
                    account: Entities.Account;
                };

                type Result = Promise<Entities.Profile>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateIdentifier {
                type Props = Omit<Partial<Entities.Identifier.ConstructorProps>, "account" | "identity" | "type"> & {
                    account: Entities.Account;
                    isPublicContact?: boolean;
                    type?: IdentifierType;
                    isVerified?: boolean;
                    identity?: string;
                    lastUsedAt?: Date;
                    createdAt?: Date;
                };

                type Result = Promise<Entities.Identifier>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateInterfaceClient {
                type Props = Omit<
                    Partial<Entities.InterfaceClient.ConstructorProps>,
                    "realm" | "authAddress" | "grantTypes" | "name" | "redirectUris"
                > & {
                    realm: string;
                    grantTypes?: TokenGrantType[];
                    redirectUris?: string[];
                    authAddress?: string;
                    name?: string;
                };

                type Result = Promise<Entities.InterfaceClient>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateServiceClient {
                type Props = Omit<Partial<Entities.ServiceClient.ConstructorProps>, "realm" | "code" | "name"> & {
                    realm: string;
                    code?: string;
                    name?: string;
                };

                type Result = Promise<Entities.ServiceClient>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateSession {
                type Props = Omit<
                    Partial<Entities.Session.ConstructorProps>,
                    "account" | "acr" | "client" | "expiresAt" | "ip" | "realms" | "scope" | "userAgent"
                > & {
                    account: Entities.Account;
                    refreshTokenHash?: string;
                    lastRefreshedAt?: Date;
                    userAgent?: string;
                    realms?: string[];
                    scope?: string;
                    createdAt?: Date;
                    expiresAt?: Date;
                    client?: string;
                    acr?: string;
                    ip?: string;
                };

                type Result = Promise<Entities.Session>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateRecoveryCode {
                type Props = Omit<Partial<Entities.RecoveryCode.ConstructorProps>, "account" | "hash"> & {
                    account: Entities.Account;
                    hash?: string;
                    used?: boolean;
                };

                type Result = Promise<Entities.RecoveryCode>;

                type Signature = (props: Props) => Result;
            }

            namespace CreatePassword {
                type Props = Omit<Partial<Entities.Password.ConstructorProps>, "account" | "hash"> & {
                    account: Entities.Account;
                    hash?: string;
                };

                type Result = Promise<Entities.Password>;

                type Signature = (props: Props) => Result;
            }

            namespace CreatePasswordHistory {
                type Props = Omit<Partial<Entities.PasswordHistory.ConstructorProps>, "account" | "hash" | "version"> & {
                    account: Entities.Account;
                    version?: number;
                    hash?: string;
                };

                type Result = Promise<Entities.PasswordHistory>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateMasterCode {
                type Props = Omit<Partial<Entities.MasterCode.ConstructorProps>, "account" | "hash"> & {
                    account: Entities.Account;
                    hash?: string;
                };

                type Result = Promise<Entities.MasterCode>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateSecondFactor {
                type Props = Omit<
                    Partial<Entities.SecondFactor.ConstructorProps>,
                    "account" | "name" | "secret" | "type"
                > & {
                    lastAcceptedTOTPStep?: number;
                    account: Entities.Account;
                    type?: SecondFactorType;
                    confirmed?: boolean;
                    secret?: string;
                    name?: string;
                };

                type Result = Promise<Entities.SecondFactor>;

                type Signature = (props: Props) => Result;
            }

            namespace CreateAuditLog {
                type Props = Omit<Partial<SystemEntities.AuditLog.ConstructorProps>, "context"> & {
                    context?: Partial<Extract.Meta>;
                };

                type Result = Promise<SystemEntities.AuditLog>;

                type Signature = (props?: Props) => Result;
            }

            namespace CreateChangeLog {
                type Props = Omit<Partial<SystemEntities.ChangeLog.ConstructorProps>, "auditEntry"> & {
                    auditEntry?: SystemEntities.AuditLog;
                };

                type Result = Promise<SystemEntities.ChangeLog>;

                type Signature = (props?: Props) => Result;
            }
        }
    }
}
