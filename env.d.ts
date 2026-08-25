import { DiagLogLevel } from "@opentelemetry/api";
import { StringValue } from "ms";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // ---------------------------------------------------------------------------
            // App
            // ---------------------------------------------------------------------------

            SERVICE_NAME: string;
            NODE_ENV: "development" | "production" | "test";
            API_VERSION: `${number}`;

            APP_BASE_IMAGE: string;
            APP_HOST: string;
            APP_PORT: `${number}`;
            GRPC_HOST: string;
            GRPC_PORT: `${number}`;
            THROTTLE_LIMIT: `${number}`;
            THROTTLE_TTL: StringValue;
            HSTS_MAX_AGE: StringValue;
            BODY_LIMIT_BYTES: `${number}`;
            ALLOWED_SERVICE_ORIGINS: string;
            ALLOWED_UI_ORIGINS: string;
            IDENTITY_SERVICE_URL: string;
            ACCESS_CONTROL_SERVICE_URL: string;
            ACCESS_CONTROL_GRPC_URL: string;

            // ---------------------------------------------------------------------------
            // OpenTelemetry
            // ---------------------------------------------------------------------------

            OTEL_EXPORTER_OTLP_ENDPOINT: string;
            OTEL_LOG_LEVEL: keyof typeof DiagLogLevel;
            OTEL_LOGS_EXPORTER: "none" | "otlp" | "console";

            // ---------------------------------------------------------------------------
            // Loki
            // ---------------------------------------------------------------------------

            LOKI_ENABLED: "true" | "false";
            LOKI_URL: string;
            LOKI_BATCH_INTERVAL: `${number}`;

            // ---------------------------------------------------------------------------
            // PostgreSQL
            // ---------------------------------------------------------------------------

            POSTGRES_DB: string;
            POSTGRES_USER: string;
            POSTGRES_PASSWORD: string;
            POSTGRES_SSL_REJECT_UNAUTHORIZED: "true" | "false";
            POSTGRES_SSL_CA_FILE: string;
            POSTGRES_SSL_CERT_FILE: string;
            POSTGRES_SSL_KEY_FILE: string;
            POSTGRES_POOL_MAX: `${number}`;
            POSTGRES_POOL_IDLE_MS: StringValue;
            POSTGRES_LOGGING: "true" | "false";

            // ---------------------------------------------------------------------------
            // PostgreSQL - write
            // ---------------------------------------------------------------------------

            POSTGRES_WRITE_POOL_MAX: `${number}`;
            POSTGRES_WRITE_POOL_IDLE_MS: StringValue;
            POSTGRES_WRITE_HOST: string;
            POSTGRES_WRITE_PORT: `${number}`;

            // ---------------------------------------------------------------------------
            // PostgreSQL - read
            // ---------------------------------------------------------------------------

            POSTGRES_READ_POOL_MAX: `${number}`;
            POSTGRES_READ_POOL_IDLE_MS: StringValue;
            POSTGRES_READ_HOST: string;
            POSTGRES_READ_PORT: `${number}`;

            // ---------------------------------------------------------------------------
            // Redis
            // ---------------------------------------------------------------------------

            REDIS_HOST: string;
            REDIS_PORT: `${number}`;
            REDIS_PASSWORD: string;
            REDIS_TLS_REJECT_UNAUTHORIZED: "true" | "false";
            REDIS_TLS_CA_FILE: string;
            REDIS_TLS_CERT_FILE: string;
            REDIS_TLS_KEY_FILE: string;
            REDIS_DB_CACHE: `${number}`;
            REDIS_DB_LIMITER: `${number}`;
            REDIS_DB_QUEUE: `${number}`;

            // ---------------------------------------------------------------------------
            // Kafka
            // ---------------------------------------------------------------------------

            KAFKA_BROKER: string;
            KAFKA_SSL_REJECT_UNAUTHORIZED: "true" | "false";
            KAFKA_SSL_CA_FILE: string;
            KAFKA_SSL_CERT_FILE: string;
            KAFKA_SSL_KEY_FILE: string;
            KAFKA_SASL_USERNAME: string;
            KAFKA_SASL_PASSWORD_FILE: string;
            KAFKA_RETRY_ATTEMPTS: `${number}`;
            KAFKA_RETRY_INITIAL_TIME: StringValue;
            KAFKAJS_NO_PARTITIONER_WARNING: `${number}`;
            KAFKA_DLQ_MAX_RETRIES: `${number}`;
            KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;
            KAFKA_DLQ_RETRY_JITTER: StringValue;

            // ---------------------------------------------------------------------------
            // Network
            // ---------------------------------------------------------------------------

            DOCKER_NETWORK_KAFKA: string;
            DOCKER_NETWORK_MONITORING: string;
            DOCKER_NETWORK_POSTGRES: string;
            DOCKER_NETWORK_REDIS: string;
            DOCKER_NETWORK_VAULT: string;
            DOCKER_VOLUME_VAULT_CA: string;
            DOCKER_VOLUME_SERVICE_TLS: string;

            // ---------------------------------------------------------------------------
            // Vault
            // ---------------------------------------------------------------------------

            VAULT_IMAGE: string;
            VAULT_AGENT_SOCKET_PATH: string;
            VAULT_PORT: `${number}`;
            VAULT_APPROLE_NAME: string;
            VAULT_TRANSIT_MOUNT: string;
            VAULT_TRANSIT_ACCESS_KEY: string;
            VAULT_TRANSIT_ACCESS_RETAIN_VERSIONS: `${number}`;
            VAULT_TRANSIT_REFRESH_KEY: string;
            VAULT_TRANSIT_REFRESH_RETAIN_VERSIONS: `${number}`;
            VAULT_TRANSIT_ID_KEY: string;
            VAULT_TRANSIT_ID_RETAIN_VERSIONS: `${number}`;
            VAULT_TRANSIT_TOTP_KEY: string;
            VAULT_TRANSIT_PAIRWISE_KEY: string;
            VAULT_KEY_TRIM_SCHEDULE: string;
            VAULT_KV_MOUNT: string;
            VAULT_KV_OAUTH_PATH: string;
            VAULT_KV_RUNTIME_PATH: string;

            // ---------------------------------------------------------------------------
            // Vault (bootstrap)
            // ---------------------------------------------------------------------------

            VAULT_PROVISIONER_TOKEN: string;

            // ---------------------------------------------------------------------------
            // Cache TTLs
            // ---------------------------------------------------------------------------

            OTP_VERIFICATION_TTL: StringValue;
            OTP_LOGIN_TTL: StringValue;
            OTP_RESET_TTL: StringValue;
            OAUTH_STATE_TTL: StringValue;
            PENDING_2FA_TTL: StringValue;
            ACCESS_CACHE_TTL: StringValue;
            REAUTHENTICATION_TTL: StringValue;

            // ---------------------------------------------------------------------------
            // Authorization Code Flow
            // ---------------------------------------------------------------------------

            AUTHORIZATION_REQUEST_TTL: StringValue;
            AUTHORIZATION_CODE_TTL: StringValue;
            APPLICATION_PER_REALM_LIMIT: `${number}`;
            INTERFACE_CLIENT_PER_APPLICATION_LIMIT: `${number}`;
            SERVICE_CLIENT_PER_APPLICATION_LIMIT: `${number}`;

            // ---------------------------------------------------------------------------
            // OAuth Providers
            // ---------------------------------------------------------------------------

            OAUTH_GOOGLE_CLIENT_ID: string;
            OAUTH_GOOGLE_CLIENT_SECRET: string;
            OAUTH_GOOGLE_REDIRECT_URI: string;

            OAUTH_GITHUB_CLIENT_ID: string;
            OAUTH_GITHUB_CLIENT_SECRET: string;
            OAUTH_GITHUB_REDIRECT_URI: string;

            // ---------------------------------------------------------------------------
            // BullMQ - cleanup
            // ---------------------------------------------------------------------------

            INACTIVE_ACCOUNT_TTL: StringValue;
            PENDING_ACCOUNT_TTL: StringValue;
            PENDING_INVITE_TTL: StringValue;
            AUDIT_LOG_RETENTION_TTL: StringValue;
            CHANGE_LOG_RETENTION_TTL: StringValue;
            CLEANUP_BATCH_SIZE: `${number}`;
            CLEANUP_BATCH_DELAY: StringValue;
            CLEANUP_BATCH_BACKOFF_DELAY: StringValue;
            CLEANUP_BATCH_ATTEMPTS: `${number}`;

            // ---------------------------------------------------------------------------
            // Authn & Security
            // ---------------------------------------------------------------------------

            // Hashing (Argon2)
            ARGON2_TYPE: "argon2id" | "argon2i" | "argon2d";
            ARGON2_MEMORY_COST_KIB: `${number}`;
            ARGON2_PARALLELISM: `${number}`;
            ARGON2_HASH_LENGTH: `${number}`;
            ARGON2_TIME_COST: `${number}`;
            ARGON2_VERSION: `${number}`;

            // JWT (ES256)
            JWT_ISSUER: string;
            JWT_ACCESS_TTL: StringValue;
            JWT_REFRESH_TTL: StringValue;
            JWT_ID_TOKEN_TTL: StringValue;

            // Session
            SESSION_EXPIRY_DAYS: StringValue;
            PENDING_TOKEN_EXPIRY_MINUTES: StringValue;
            SESSION_MAX_ACTIVE_COUNT: `${number}`;

            // Password
            PASSWORD_HISTORY_CHECK_DAYS: StringValue;
            PASSWORD_VALIDATION_MODE: "local" | "pwned" | "simple";
            HIBP_REQUEST_TIMEOUT: StringValue;
            HIBP_RANGE_URL: string;
        }
    }
}
