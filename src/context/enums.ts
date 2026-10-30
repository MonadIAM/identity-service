export * from "@monadiam/shared";

export enum ResponseViewType {
    /* eslint-disable prettier/prettier */
    DETAILED = "DETAILED",
    COMPACT  = "COMPACT",
    /* eslint-enable prettier/prettier */
}

export enum QueryMode {
    /* eslint-disable prettier/prettier */
    DEFAULT = "DEFAULT",
    MANAGE  = "MANAGE",
    /* eslint-enable prettier/prettier */
}

export enum SecondFactorType {
    TOTP = "totp",
}

export enum OAuthTokenTypeHint {
    /* eslint-disable prettier/prettier */
    REFRESH_TOKEN = "refresh_token",
    ACCESS_TOKEN  = "access_token",
    /* eslint-enable prettier/prettier */
}

export enum OAuthResponseType {
    CODE = "code",
}

export enum CodeChallengeMethod {
    S256 = "S256",
}

export enum Client {
    WEB_DEV = "web-dev",
}

export enum AuthenticationContextClass {
    /* eslint-disable prettier/prettier */
    FEDERATED = "federated",
    PASSWORD  = "pwd",
    OTP       = "otp",
    MFA       = "mfa",
    /* eslint-enable prettier/prettier */
}

export enum OidcScope {
    /* eslint-disable prettier/prettier */
    // OFFLINE_ACCESS = "offline_access",
    PROFILE        = "profile",
    OPENID         = "openid",
    EMAIL          = "email",
    /* eslint-enable prettier/prettier */
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
    INTERFACE_CLIENT = "INTERFACE_CLIENT",
    SERVICE_CLIENT   = "SERVICE_CLIENT",
    RECOVERY_CODE    = "RECOVERY_CODE",
    SECOND_FACTOR    = "SECOND_FACTOR",
    OAUTH_CLIENT     = "OAUTH_CLIENT",
    MASTER_CODE      = "MASTER_CODE",
    IDENTIFIER       = "IDENTIFIER",
    PASSWORD         = "PASSWORD",
    PROFILE          = "PROFILE",
    SESSION          = "SESSION",
    ACCOUNT          = "ACCOUNT",
    REALM            = "REALM",
    /* eslint-enable prettier/prettier */
}

export enum CleanupJob {
    /* eslint-disable prettier/prettier */
    DEACTIVATED_ACCOUNTS = "cleanup-deactivated-accounts",
    INACTIVE_ACCOUNTS    = "cleanup-inactive-accounts",
    PENDING_ACCOUNTS     = "cleanup-pending-accounts",
    CHANGE_LOG           = "cleanup-change-log",
    AUDIT_LOG            = "cleanup-audit-log",
    INBOX                = "cleanup-inbox",
    /* eslint-enable prettier/prettier */
}
