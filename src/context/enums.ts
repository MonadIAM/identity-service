export enum ResponseViewType {
    DETAILED = "DETAILED",
    COMPACT = "COMPACT",
}

export enum AccountSubject {
    SERVICE = "SERVICE",
    SYSTEM = "SYSTEM",
    HUMAN = "HUMAN",
}

export enum AccountStatus {
    DEACTIVATED = "DEACTIVATED",
    SUSPENDED = "SUSPENDED",
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
}

export enum IdentifierType {
    EMAIL = "email",
    PHONE = "phone",
    OAUTH = "oauth",
}

export enum SecondFactorType {
    TOTP = "totp",
}

export enum NotificationCategory {
    SECURITY = "security",
    ACCOUNT = "account",
    ACCESS = "access",
    SYSTEM = "system",
}

export enum PermissionCode {}
