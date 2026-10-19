import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { parse } from "dotenv";

import { EnvironmentVariablesDTO } from "~common/dto";

import { validateEnv } from "./env.validator";

// Synthetic configuration: never reads local environment files or credentials.
const config = {
    ACCESS_CONTROL_GRPC_URL: "test",
    VAULT_TRANSIT_ACCESS_KEY: "test",
    VAULT_TRANSIT_REFRESH_KEY: "test",
    VAULT_TRANSIT_ID_KEY: "test",
    VAULT_TRANSIT_TOTP_KEY: "test",
    VAULT_TRANSIT_PAIRWISE_KEY: "test",
    OTP_VERIFICATION_TTL: "1s",
    OTP_LOGIN_TTL: "1s",
    OTP_RESET_TTL: "1s",
    OAUTH_STATE_TTL: "1s",
    PENDING_2FA_TTL: "1s",
    ACCESS_CACHE_TTL: "1s",
    REAUTHENTICATION_TTL: "1s",
    AUTHORIZATION_REQUEST_TTL: "1s",
    AUTHORIZATION_CODE_TTL: "1s",
    INTERFACE_CLIENT_PER_REALM_LIMIT: "1",
    INTERFACE_CLIENT_REDIRECT_URI_LIMIT: "1",
    SERVICE_CLIENT_PER_REALM_LIMIT: "1",
    OAUTH_GOOGLE_CLIENT_ID: "test",
    OAUTH_GOOGLE_CLIENT_SECRET: "test",
    OAUTH_GOOGLE_REDIRECT_URI: "test",
    OAUTH_GITHUB_CLIENT_ID: "test",
    OAUTH_GITHUB_CLIENT_SECRET: "test",
    OAUTH_GITHUB_REDIRECT_URI: "test",
    INACTIVE_ACCOUNT_TTL: "1s",
    PENDING_ACCOUNT_TTL: "1s",
    ARGON2_TYPE: "argon2id",
    ARGON2_MEMORY_COST_KIB: "1",
    ARGON2_HASH_LENGTH: "1",
    ARGON2_PARALLELISM: "1",
    ARGON2_TIME_COST: "1",
    ARGON2_VERSION: "1",
    JWT_ACCESS_TTL: "1s",
    JWT_REFRESH_TTL: "1s",
    JWT_ID_TOKEN_TTL: "1s",
    SESSION_EXPIRY_DAYS: "1s",
    PENDING_TOKEN_EXPIRY_MINUTES: "1s",
    SESSION_MAX_ACTIVE_COUNT: "1",
    SESSION_REFRESH_IDEMPOTENCY_TTL: "1s",
    PASSWORD_VALIDATION_MODE: "local",
    PASSWORD_HISTORY_CHECK_DAYS: "1s",
    HIBP_REQUEST_TIMEOUT: "1s",
    HIBP_RANGE_URL: "test",
    SERVICE_NAME: "test",
    NODE_ENV: "local",
    API_VERSION: "1",
    APP_BASE_IMAGE: "test",
    APP_HOST: "test",
    APP_PORT: "3000",
    THROTTLE_LIMIT: "1",
    THROTTLE_TTL: "1s",
    HSTS_MAX_AGE: "1s",
    BODY_LIMIT_BYTES: "1",
    JWT_ISSUER: "test",
    IDENTITY_SERVICE_URL: "test",
    ACCESS_CONTROL_SERVICE_URL: "test",
    NOTIFICATION_SERVICE_URL: "test",
    ORGANIZATION_SERVICE_URL: "test",
    HR_SERVICE_URL: "test",
    DOCS_OAUTH_CLIENT_ID: "550e8400-e29b-41d4-a716-446655440000",
    ALLOWED_SERVICE_ORIGINS: "test",
    ALLOWED_UI_ORIGINS: "test",
    OTEL_EXPORTER_OTLP_ENDPOINT: "test",
    OTEL_LOG_LEVEL: "INFO",
    OTEL_LOGS_EXPORTER: "none",
    OTEL_TRACES_SAMPLER: "always_off",
    OTEL_TRACES_SAMPLER_ARG: "0.5",
    POSTGRES_DB: "test",
    POSTGRES_USER: "test",
    POSTGRES_PASSWORD: "test",
    POSTGRES_LOGGING: "false",
    POSTGRES_WRITE_HOST: "test",
    POSTGRES_WRITE_PORT: "1",
    POSTGRES_WRITE_POOL_MAX: "1",
    POSTGRES_WRITE_POOL_IDLE_MS: "1s",
    POSTGRES_READ_HOST: "test",
    POSTGRES_READ_PORT: "1",
    POSTGRES_READ_POOL_MAX: "1",
    POSTGRES_READ_POOL_IDLE_MS: "1s",
    REDIS_HOST: "test",
    REDIS_PORT: "1",
    REDIS_PASSWORD: "test",
    REDIS_DB_CACHE: "1",
    REDIS_DB_LIMITER: "1",
    REDIS_DB_QUEUE: "1",
    KAFKA_BROKER: "test",
    KAFKA_RETRY_ATTEMPTS: "1",
    KAFKA_PARTITIONS_CONSUMED_CONCURRENTLY: "1",
    KAFKA_RETRY_INITIAL_TIME: "1s",
    KAFKAJS_NO_PARTITIONER_WARNING: "1",
    KAFKA_CONSUMER_MAX_RETRIES: "1",
    KAFKA_CONSUMER_RETRY_INITIAL_DELAY: "1s",
    KAFKA_CONSUMER_RETRY_MAX_DELAY: "1s",
    SCHEMA_REGISTRY_URL: "test",
    AUDIT_LOG_RETENTION_TTL: "1s",
    CHANGE_LOG_RETENTION_TTL: "1s",
    INBOX_RETENTION_TTL: "1s",
    CLEANUP_BATCH_SIZE: "1",
    CLEANUP_BATCH_DELAY: "1s",
    CLEANUP_BATCH_BACKOFF_DELAY: "1s",
    CLEANUP_BATCH_ATTEMPTS: "1",
    DOCKER_NETWORK_KAFKA: "test",
    DOCKER_NETWORK_POSTGRES: "test",
    DOCKER_NETWORK_REDIS: "test",
    DOCKER_NETWORK_VAULT: "test",
    VAULT_IMAGE: "test",
    VAULT_AGENT_SOCKET_PATH: "test",
    VAULT_APPROLE_NAME: "test",
    VAULT_TRANSIT_MOUNT: "test",
    VAULT_TRANSIT_AUDIT_MASK_KEY: "test",
    VAULT_TRANSIT_AUDIT_LOG_KEY: "test",
    VAULT_ADDR: "http://localhost:8200",
    VAULT_TOKEN: "test-only-token",
};

describe("[Validator] - Environment", () => {
    describe("[Function] - validateEnv", () => {
        it.each(["local", "stand"])(
            "[case] - validates the actual %s template with injected credentials",
            (environment) => {
                // Arrange
                const template = parse(readFileSync(`.env.${environment}.example`, "utf8"));
                const input = {
                    ...template,
                    POSTGRES_USER: "service",
                    POSTGRES_PASSWORD: "secret",
                    REDIS_PASSWORD: "secret",
                    OAUTH_GOOGLE_CLIENT_SECRET: "secret",
                    OAUTH_GITHUB_CLIENT_SECRET: "secret",
                };

                // Act
                const result = validateEnv(input);

                // Assert
                expect(result.NODE_ENV).toBe(environment);
                expect(result.REDIS_SENTINEL_ENABLED).toBe(environment === "stand");
                expect(result.POSTGRES_WRITE_PORT).toBe(5432);
            },
        );

        it.each([
            { REDIS_SENTINEL_PORT: undefined },
            { REDIS_SENTINEL_PORT: "65536" },
            { REDIS_SENTINEL_MASTER: undefined },
            { REDIS_SENTINEL_MASTER: "" },
        ])("[case] - rejects incomplete or invalid Sentinel settings: %j", (override) => {
            // Arrange
            const input = {
                ...config,
                REDIS_SENTINEL_ENABLED: "true",
                REDIS_SENTINEL_PORT: "26379",
                REDIS_SENTINEL_MASTER: "identity-redis",
                ...override,
            };

            // Act
            const act = (): unknown => validateEnv(input);

            // Assert
            expect(act).toThrow("REDIS_SENTINEL_");
        });

        it.each(["POSTGRES_SSL", "KAFKA_SSL"])("[case] - requires a CA file when %s is enabled", (prefix) => {
            // Arrange
            const input = {
                ...config,
                [`${prefix}_ENABLED`]: "true",
                [`${prefix}_REJECT_UNAUTHORIZED`]: "true",
            };

            // Act
            const act = (): unknown => validateEnv(input);

            // Assert
            expect(act).toThrow(`${prefix}_CA_FILE`);
        });

        it("[case] - requires a direct Redis port when Sentinel is disabled", () => {
            // Arrange
            const input = { ...config, REDIS_PORT: undefined, REDIS_SENTINEL_ENABLED: "false" };

            // Act
            const act = (): unknown => validateEnv(input);

            // Assert
            expect(act).toThrow("REDIS_PORT");
        });

        it("[case] - returns a typed configuration with explicit number and boolean conversion", () => {
            // Arrange

            // Act
            const result = validateEnv(config);

            // Assert
            expect(result).toBeInstanceOf(EnvironmentVariablesDTO);
            expect(result.APP_PORT).toBe(3000);
            expect(result.POSTGRES_LOGGING).toBe(false);
            expect(result.SERVICE_NAME).toBe("test");
            expect(config.APP_PORT).toBe("3000");
        });

        it("[case] - rejects missing required fields and aggregates their validation errors", () => {
            // Arrange

            // Act
            const act = (): unknown => validateEnv({ ...config, SERVICE_NAME: undefined, APP_PORT: undefined });
            const act2 = (): unknown => validateEnv({ ...config, SERVICE_NAME: undefined, APP_PORT: undefined });

            // Assert
            expect(act).toThrow(/SERVICE_NAME/);
            expect(act2).toThrow(/APP_PORT/);
        });

        it.each([
            { field: "APP_PORT", value: "65536" },
            { field: "POSTGRES_LOGGING", value: "garbage" },
            { field: "THROTTLE_TTL", value: "1garbage" },
            { field: "NODE_ENV", value: "unknown" },
            { field: "SERVICE_NAME", value: 123 },
        ])("[case] - rejects invalid $field without implicit string coercion", ({ field, value }) => {
            // Arrange

            // Act
            const act = (): unknown => validateEnv({ ...config, [field]: value });

            // Assert
            expect(act).toThrow(field);
        });

        it("[case] - accepts missing settings when Loki is disabled", () => {
            // Arrange
            const input = { ...config, LOKI_ENABLED: "false" };

            // Act
            const act = (): unknown => validateEnv(input);

            // Assert
            expect(act).not.toThrow();
        });
        it("[case] - requires a URL when Loki is enabled", () => {
            // Arrange
            const input = { ...config, LOKI_ENABLED: "true" };

            // Act
            const act = (): unknown => validateEnv(input);

            // Assert
            expect(act).toThrow("LOKI_URL");
        });
        it("[case] - parses enabled Loki settings", () => {
            // Arrange
            const input = {
                ...config,
                LOKI_URL: "http://localhost:3100",
                LOKI_BATCH_INTERVAL: "1000",
                LOKI_ENABLED: "true",
            };

            // Act
            const result = validateEnv(input);

            // Assert
            expect(result).toMatchObject({ LOKI_ENABLED: true, LOKI_BATCH_INTERVAL: 1000 });
        });
    });
});
