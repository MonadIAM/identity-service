declare namespace Fixtures.Core {
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
        type Props = Omit<Partial<Entities.Identifier.ConstructorProps>, "account"> & {
            account: Entities.Account;
            isPublicContact?: boolean;
            lastUsedAt?: Date;
            createdAt?: Date;
        };

        type Result = Promise<Entities.Identifier>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateInterfaceClient {
        type Props = Omit<Partial<Entities.InterfaceClient.ConstructorProps>, "realm"> & {
            realm: string;
        };

        type Result = Promise<Entities.InterfaceClient>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateServiceClient {
        type Props = Omit<Partial<Entities.ServiceClient.ConstructorProps>, "realm"> & {
            realm: string;
        };

        type Result = Promise<Entities.ServiceClient>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateSession {
        type Props = Omit<Partial<Entities.Session.ConstructorProps>, "account"> & {
            account: Entities.Account;
            refreshTokenHash?: string;
            lastRefreshedAt?: Date;
            createdAt?: Date;
        };

        type Result = Promise<Entities.Session>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateRecoveryCode {
        type Props = Omit<Partial<Entities.RecoveryCode.ConstructorProps>, "account"> & {
            account: Entities.Account;
            used?: boolean;
        };

        type Result = Promise<Entities.RecoveryCode>;

        type Signature = (props: Props) => Result;
    }

    namespace CreatePassword {
        type Props = Omit<Partial<Entities.Password.ConstructorProps>, "account"> & {
            account: Entities.Account;
        };

        type Result = Promise<Entities.Password>;

        type Signature = (props: Props) => Result;
    }

    namespace CreatePasswordHistory {
        type Props = Omit<Partial<Entities.PasswordHistory.ConstructorProps>, "account"> & {
            account: Entities.Account;
        };

        type Result = Promise<Entities.PasswordHistory>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateMasterCode {
        type Props = Omit<Partial<Entities.MasterCode.ConstructorProps>, "account"> & {
            account: Entities.Account;
        };

        type Result = Promise<Entities.MasterCode>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateSecondFactor {
        type Props = Omit<Partial<Entities.SecondFactor.ConstructorProps>, "account"> & {
            account: Entities.Account;
            lastAcceptedTOTPStep?: number;
            confirmed?: boolean;
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
