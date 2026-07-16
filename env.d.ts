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
            // PostgreSQL
            // ---------------------------------------------------------------------------

            POSTGRES_IMAGE: string;
            POSTGRES_DB: string;
            POSTGRES_USER: string;
            POSTGRES_PASSWORD: string;
            POSTGRES_HOST: string;
            POSTGRES_PORT: `${number}`;
            POSTGRES_PRIMARY_PUBLISHED_PORT: `${number}`;
            POSTGRES_REPLICA_PUBLISHED_PORT: `${number}`;
            POSTGRES_SSL: "true" | "false";
            POSTGRES_SSL_REJECT_UNAUTHORIZED: "true" | "false";
            POSTGRES_POOL_MAX: `${number}`;
            POSTGRES_POOL_IDLE_MS: StringValue;
            POSTGRES_LOGGING: "true" | "false";
            POSTGRES_CQRS_ENABLED: "true" | "false";

            // ---------------------------------------------------------------------------
            // PostgreSQL - write
            // ---------------------------------------------------------------------------

            POSTGRES_WRITE_POOL_MAX: `${number}`;
            POSTGRES_WRITE_POOL_IDLE_MS: StringValue;
            POSTGRES_WRITE_HOST: string;

            // ---------------------------------------------------------------------------
            // PostgreSQL - read
            // ---------------------------------------------------------------------------

            POSTGRES_READ_POOL_MAX: `${number}`;
            POSTGRES_READ_POOL_IDLE_MS: StringValue;
            POSTGRES_READ_HOST: string;

            // ---------------------------------------------------------------------------
            // PostgreSQL - replication
            // ---------------------------------------------------------------------------

            POSTGRES_REPLICATION_USER: string;
            POSTGRES_REPLICATION_SLOT: string;

            // ---------------------------------------------------------------------------
            // Redis
            // ---------------------------------------------------------------------------

            REDIS_IMAGE: string;
            REDIS_HOST: string;
            REDIS_PORT: `${number}`;
            REDIS_PUBLISHED_PORT: `${number}`;
            REDIS_PASSWORD: string;
            REDIS_DB_CACHE: `${number}`;
            REDIS_DB_LIMITER: `${number}`;
            REDIS_DB_QUEUE: `${number}`;

            // ---------------------------------------------------------------------------
            // Kafka
            // ---------------------------------------------------------------------------

            KAFKA_BROKER: string;
            KAFKA_RETRY_ATTEMPTS: `${number}`;
            KAFKA_RETRY_INITIAL_TIME: StringValue;
            KAFKA_CONNECT_IMAGE: string;
            KAFKA_CONNECT_PORT: `${number}`;
            KAFKAJS_NO_PARTITIONER_WARNING: `${number}`;
            KAFKA_DLQ_MAX_RETRIES: `${number}`;
            KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;
            KAFKA_DLQ_RETRY_JITTER: StringValue;

            // ---------------------------------------------------------------------------
            // Network
            // ---------------------------------------------------------------------------

            DOCKER_NETWORK_KAFKA: string;
            DOCKER_NETWORK_MONITORING: string;
            DOCKER_NETWORK_VAULT: string;

            // ---------------------------------------------------------------------------
            // Debezium
            // ---------------------------------------------------------------------------

            DEBEZIUM_INIT_IMAGE: string;

            // ---------------------------------------------------------------------------
            // Vault
            // ---------------------------------------------------------------------------

            VAULT_IMAGE: string;
            VAULT_URL: string;
            VAULT_PORT: `${number}`;
            VAULT_ROOT_TOKEN: string;
            VAULT_TOKEN: string;
            VAULT_TRANSIT_MOUNT: string;
            VAULT_TRANSIT_ACCESS_KEY: string;
            VAULT_TRANSIT_ACCESS_ROTATION_PERIOD: StringValue;
            VAULT_TRANSIT_ACCESS_RETAIN_VERSIONS: `${number}`;
            VAULT_TRANSIT_REFRESH_KEY: string;
            VAULT_TRANSIT_REFRESH_ROTATION_PERIOD: StringValue;
            VAULT_TRANSIT_REFRESH_RETAIN_VERSIONS: `${number}`;
            VAULT_TRANSIT_ID_KEY: string;
            VAULT_TRANSIT_ID_ROTATION_PERIOD: StringValue;
            VAULT_TRANSIT_ID_RETAIN_VERSIONS: `${number}`;
            VAULT_TRANSIT_TOTP_KEY: string;
            VAULT_TRANSIT_TOTP_ROTATION_PERIOD: StringValue;
            VAULT_TRANSIT_PAIRWISE_KEY: string;
            VAULT_KEY_TRIM_SCHEDULE: string;
            VAULT_KV_MOUNT: string;
            VAULT_KV_OAUTH_PATH: string;
            VAULT_KV_RUNTIME_PATH: string;
            VAULT_KV_REPLICATION_PATH: string;

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
            // AWS (SES/SNS)
            // ---------------------------------------------------------------------------

            AWS_REGION: string;
            AWS_ACCESS_KEY_ID: string;
            AWS_SECRET_ACCESS_KEY: string;
            EMAIL_FROM: string;

            // ---------------------------------------------------------------------------
            // BullMQ - cleanup
            // ---------------------------------------------------------------------------

            INACTIVE_ACCOUNT_TTL: StringValue;
            PENDING_ACCOUNT_TTL: StringValue;
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
