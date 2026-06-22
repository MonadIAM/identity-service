export * from "@liam/contracts";

export enum ResponseViewType {
    /* eslint-disable prettier/prettier */
    DETAILED = "DETAILED",
    COMPACT  = "COMPACT",
    /* eslint-enable prettier/prettier */
}

export enum AccountSubject {
    /* eslint-disable prettier/prettier */
    SERVICE = "SERVICE",
    SYSTEM  = "SYSTEM",
    HUMAN   = "HUMAN",
    /* eslint-enable prettier/prettier */
}

export enum AccountStatus {
    /* eslint-disable prettier/prettier */
    DEACTIVATED = "DEACTIVATED",
    SUSPENDED   = "SUSPENDED",
    PENDING     = "PENDING",
    ACTIVE      = "ACTIVE",
    /* eslint-enable prettier/prettier */
}

export enum QueryMode {
    /* eslint-disable prettier/prettier */
    DEFAULT = "DEFAULT",
    MANAGE  = "MANAGE",
    /* eslint-enable prettier/prettier */
}

export enum IdentifierType {
    EMAIL = "email",
    PHONE = "phone",
    OAUTH = "oauth",
}

export enum SecondFactorType {
    TOTP = "totp",
}

export enum TokenGrantType {
    PASSWORD = "password",
    REFRESH_TOKEN = "refresh_token",
}

export enum Client {
    WEB_DEV = "web-dev",
}

export enum ActionType {
    /* eslint-disable prettier/prettier */
    DEACTIVATE = "DEACTIVATE",
    REGENERATE = "REGENERATE",
    SIGN_IN    = "SIGN_IN",
    SIGN_UP    = "SIGN_UP",
    REFRESH    = "REFRESH",
    RESTORE    = "RESTORE",
    CREATE     = "CREATE",
    UPDATE     = "UPDATE",
    REVOKE     = "REVOKE",
    VERIFY     = "VERIFY",
    PURGE      = "PURGE",
    GRANT      = "GRANT",
    RESET      = "RESET",
    /* eslint-enable prettier/prettier */
}

export enum EntityType {
    /* eslint-disable prettier/prettier */
    REAUTHENTICATION = "REAUTHENTICATION",
    RECOVERY_CODE   = "RECOVERY_CODE",
    SECOND_FACTOR   = "SECOND_FACTOR",
    MASTER_CODE     = "MASTER_CODE",
    IDENTIFIER      = "IDENTIFIER",
    PASSWORD        = "PASSWORD",
    PROFILE         = "PROFILE",
    SESSION         = "SESSION",
    ACCOUNT         = "ACCOUNT",
    /* eslint-enable prettier/prettier */
}

export enum CleanupJob {
    /* eslint-disable prettier/prettier */
    INACTIVE_ACCOUNTS = "cleanup-inactive-accounts",
    PENDING_ACCOUNTS  = "cleanup-pending-accounts",
    /* eslint-enable prettier/prettier */
}
