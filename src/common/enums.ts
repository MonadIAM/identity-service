export enum NodeEnv {
    /* eslint-disable prettier/prettier */
    LOCAL       = "local",
    STAND       = "stand",
    /* eslint-enable prettier/prettier */
}

export enum PasswordValidationMode {
    /* eslint-disable prettier/prettier */
    LOCAL  = "local",  // Local, offline blocklist of common/compromised passwords — no external network call.
    PWNED  = "pwned",  // HaveIBeenPwned Pwned Passwords range API (k-anonymity) — fails open on its own on timeout/outage.
    SIMPLE = "simple", // Legacy composition rules (digit + uppercase + special character) — explicitly against
    /* eslint-enable prettier/prettier */
}

export enum Argon2Type {
    /* eslint-disable prettier/prettier */
    ARGON2ID = "argon2id",
    ARGON2I  = "argon2i",
    ARGON2D  = "argon2d",
    /* eslint-enable prettier/prettier */
}

export enum OTelTracesSampler {
    PARENTBASED_TRACEIDRATIO = "parentbased_traceidratio",
    PARENTBASED_ALWAYS_OFF = "parentbased_always_off",
    PARENTBASED_ALWAYS_ON = "parentbased_always_on",
    TRACEIDRATIO = "traceidratio",
    ALWAYS_OFF = "always_off",
    ALWAYS_ON = "always_on",
}

export enum OTelLogsExporter {
    CONSOLE = "console",
    OTLP = "otlp",
    NONE = "none",
}
