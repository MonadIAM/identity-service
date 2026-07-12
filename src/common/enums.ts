export enum NodeEnv {
    /* eslint-disable prettier/prettier */
    DEVELOPMENT = "development",
    PRODUCTION  = "production",
    TEST        = "test",
    /* eslint-enable prettier/prettier */
}

export enum PasswordValidationMode {
    /* eslint-disable prettier/prettier */
    LOCAL  = "local",  // Local, offline blocklist of common/compromised passwords — no external network call.
    PWNED  = "pwned",  // HaveIBeenPwned Pwned Passwords range API (k-anonymity) — fails open on its own on timeout/outage.
    SIMPLE = "simple", // Legacy composition rules (digit + uppercase + special character) — explicitly against
    /* eslint-enable prettier/prettier */
}
