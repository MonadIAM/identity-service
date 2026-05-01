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

export enum IdentifierType {
    EMAIL = "email",
    PHONE = "phone",
    OAUTH = "oauth",
}

export enum SecondFactorType {
    TOTP = "totp",
}

export enum IdentityActionType {
    /* eslint-disable prettier/prettier */
    /* Account */
    LINK_OAUTH_IDENTIFIER = "LINK_OAUTH_IDENTIFIER",
    DEACTIVATE_ACCOUNT    = "DEACTIVATE_ACCOUNT",
    RESTORE_ACCOUNT       = "RESTORE_ACCOUNT",
    SUSPEND_ACCOUNT       = "SUSPEND_ACCOUNT",
    SIGN_IN_ACCOUNT       = "SIGN_IN_ACCOUNT",
    SIGN_UP_ACCOUNT       = "SIGN_UP_ACCOUNT",
    VERIFY_ACCOUNT        = "VERIFY_ACCOUNT",

    /* Identifier */
    TOGGLE_PUBLIC_CONTACT = "TOGGLE_PUBLIC_CONTACT",
    TOGGLE_NOTIFICATIONS  = "TOGGLE_NOTIFICATIONS",
    VERIFY_IDENTIFIER     = "VERIFY_IDENTIFIER",
    PURGE_IDENTIFIER      = "PURGE_IDENTIFIER",
    ADD_IDENTIFIER        = "ADD_IDENTIFIER",

    /* Password */
    RESET_PASSWORD_BY_RECOVERY_CODE = "RESET_PASSWORD_BY_RECOVERY_CODE",
    RESET_PASSWORD_BY_OTP           = "RESET_PASSWORD_BY_OTP",
    CHANGE_PASSWORD                 = "CHANGE_PASSWORD",

    /* Profile */
    UPDATE_PROFILE = "UPDATE_PROFILE",

    /* Second Factor */
    INITIATE_SECOND_FACTOR_SETUP = "INITIATE_SECOND_FACTOR_SETUP",
    VERIFY_SECOND_FACTOR         = "VERIFY_SECOND_FACTOR",
    RESET_SECOND_FACTORS         = "RESET_SECOND_FACTORS",
    PURGE_SECOND_FACTOR          = "PURGE_SECOND_FACTOR",

    /* Recovery Codes */
    REGENERATE_RECOVERY_CODES = "REGENERATE_RECOVERY_CODES",

    /* Session */
    REVOKE_ALL_SESSIONS = "REVOKE_ALL_SESSIONS",
    REVOKE_SESSIONS     = "REVOKE_SESSIONS",
    REFRESH_SESSION     = "REFRESH_SESSION",
    CREATE_SESSION      = "CREATE_SESSION",

    /* Scheduled */
    PURGE_PASSWORD_HISTORY = "PURGE_PASSWORD_HISTORY",
    /* eslint-enable prettier/prettier */
}

export enum EntityType {
    /* eslint-disable prettier/prettier */
    RECOVERY_CODE = "RECOVERY_CODE",
    SECOND_FACTOR = "SECOND_FACTOR",
    MASTER_CODE   = "MASTER_CODE",
    IDENTIFIER    = "IDENTIFIER",
    PASSWORD      = "PASSWORD",
    PROFILE       = "PROFILE",
    SESSION       = "SESSION",
    ACCOUNT       = "ACCOUNT",
    /* eslint-enable prettier/prettier */
}

export const AggregateType = EntityType;
export type AggregateType = EntityType;

export enum KafkaTopic {
    /* eslint-disable prettier/prettier */
    BLACKLIST = "blacklist",
    ACCOUNT   = "account",
    /* eslint-enable prettier/prettier */
}

export enum EventType {
    /* eslint-disable prettier/prettier */
    ACCOUNT_REGISTERED = "ACCOUNT_REGISTERED",
    SESSION_REVOKED    = "SESSION_REVOKED",
    ACCOUNT_PURGED     = "ACCOUNT_PURGED",
    /* eslint-enable prettier/prettier */
}

export enum PermissionCode {}
