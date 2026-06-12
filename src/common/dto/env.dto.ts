import { StringValue } from "ms";

import { Validator } from "~common/validator";
import { NodeEnv } from "~common/enums";

export class EnvironmentVariablesDTO {
    // ---------------------------------------------------------------------------
    // App
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public SERVICE_NAME: string;

    @Validator.IsEnum(NodeEnv)
    declare public NODE_ENV: NodeEnv;

    @Validator.IsPositiveInt()
    declare public API_VERSION: number;

    @Validator.IsString()
    declare public APP_BASE_IMAGE: string;

    @Validator.IsString()
    declare public APP_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public APP_PORT: number;

    @Validator.IsString()
    declare public GRPC_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public GRPC_PORT: number;

    @Validator.IsPositiveInt()
    declare public THROTTLE_LIMIT: number;

    @Validator.IsMsString()
    declare public THROTTLE_TTL: StringValue;

    @Validator.IsMsString()
    declare public HSTS_MAX_AGE: StringValue;

    @Validator.IsPositiveInt()
    declare public BODY_LIMIT_BYTES: number;

    @Validator.IsString()
    declare public ALLOWED_SERVICE_ORIGINS: string;

    @Validator.IsString()
    declare public ALLOWED_UI_ORIGINS: string;

    @Validator.IsString()
    declare public IDENTITY_SERVICE_URL: string;

    @Validator.IsString()
    declare public ACCESS_CONTROL_SERVICE_URL: string;

    @Validator.IsString()
    declare public ACCESS_CONTROL_GRPC_URL: string;

    // ---------------------------------------------------------------------------
    // PostgreSQL - common
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_IMAGE: string;

    @Validator.IsString()
    declare public POSTGRES_DB: string;

    @Validator.IsString()
    declare public POSTGRES_USER: string;

    @Validator.IsString()
    declare public POSTGRES_PASSWORD: string;

    @Validator.IsString()
    declare public POSTGRES_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_PRIMARY_PUBLISHED_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_REPLICA_PUBLISHED_PORT: number;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL: boolean;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL_REJECT_UNAUTHORIZED: boolean;

    @Validator.IsPositiveInt()
    declare public POSTGRES_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_POOL_IDLE_MS: StringValue;

    @Validator.IsBoolean()
    declare public POSTGRES_LOGGING: boolean;

    @Validator.IsBoolean()
    declare public POSTGRES_CQRS_ENABLED: boolean;

    // ---------------------------------------------------------------------------
    // PostgreSQL - write-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_WRITE_HOST: string;

    @Validator.IsPositiveInt()
    declare public POSTGRES_WRITE_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_WRITE_POOL_IDLE_MS: StringValue;

    // ---------------------------------------------------------------------------
    // PostgreSQL - read-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_READ_HOST: string;

    @Validator.IsPositiveInt()
    declare public POSTGRES_READ_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_READ_POOL_IDLE_MS: StringValue;

    // ---------------------------------------------------------------------------
    // PostgreSQL - replication
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_USER: string;

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_SLOT: string;

    // ---------------------------------------------------------------------------
    // Redis
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public REDIS_IMAGE: string;

    @Validator.IsString()
    declare public REDIS_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public REDIS_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public REDIS_PUBLISHED_PORT: number;

    @Validator.IsString()
    declare public REDIS_PASSWORD: string;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public REDIS_DB_CACHE: number;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public REDIS_DB_LIMITER: number;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public REDIS_DB_QUEUE: number;

    // ---------------------------------------------------------------------------
    // Kafka
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public KAFKA_BROKER: string;

    @Validator.IsPositiveInt()
    declare public KAFKA_RETRY_ATTEMPTS: number;

    @Validator.IsMsString()
    declare public KAFKA_RETRY_INITIAL_TIME: StringValue;

    @Validator.IsString()
    declare public DOCKER_NETWORK_NAME: string;

    @Validator.IsString()
    declare public KAFKA_CONNECT_IMAGE: string;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public KAFKA_CONNECT_PORT: number;

    @Validator.IsInt()
    declare public KAFKAJS_NO_PARTITIONER_WARNING: number;

    @Validator.IsInt()
    declare public KAFKA_DLQ_MAX_RETRIES: number;

    @Validator.IsMsString()
    declare public KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;

    @Validator.IsMsString()
    declare public KAFKA_DLQ_RETRY_JITTER: StringValue;

    // ---------------------------------------------------------------------------
    // Debezium
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public DEBEZIUM_INIT_IMAGE: string;

    // ---------------------------------------------------------------------------
    // Vault
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public VAULT_IMAGE: string;

    @Validator.IsString()
    declare public VAULT_URL: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public VAULT_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public VAULT_PUBLISHED_PORT: number;

    @Validator.IsString()
    declare public VAULT_ROOT_TOKEN: string;

    @Validator.IsString()
    declare public VAULT_TOKEN: string;

    @Validator.IsString()
    declare public VAULT_TRANSIT_MOUNT: string;

    @Validator.IsString()
    declare public VAULT_TRANSIT_ACCESS_KEY: string;

    @Validator.IsMsString()
    declare public VAULT_TRANSIT_ACCESS_ROTATION_PERIOD: StringValue;

    @Validator.IsPositiveInt()
    declare public VAULT_TRANSIT_ACCESS_RETAIN_VERSIONS: number;

    @Validator.IsString()
    declare public VAULT_TRANSIT_REFRESH_KEY: string;

    @Validator.IsMsString()
    declare public VAULT_TRANSIT_REFRESH_ROTATION_PERIOD: StringValue;

    @Validator.IsPositiveInt()
    declare public VAULT_TRANSIT_REFRESH_RETAIN_VERSIONS: number;

    @Validator.IsString()
    declare public VAULT_TRANSIT_TOTP_KEY: string;

    @Validator.IsMsString()
    declare public VAULT_TRANSIT_TOTP_ROTATION_PERIOD: StringValue;

    @Validator.IsString()
    declare public VAULT_KEY_TRIM_SCHEDULE: string;

    @Validator.IsString()
    declare public VAULT_KV_MOUNT: string;

    @Validator.IsString()
    declare public VAULT_KV_OAUTH_PATH: string;

    @Validator.IsString()
    declare public VAULT_KV_RUNTIME_PATH: string;

    @Validator.IsString()
    declare public VAULT_KV_REPLICATION_PATH: string;

    // ---------------------------------------------------------------------------
    // Cache TTLs
    // ---------------------------------------------------------------------------

    @Validator.IsMsString()
    declare public OTP_VERIFICATION_TTL: StringValue;

    @Validator.IsMsString()
    declare public OTP_LOGIN_TTL: StringValue;

    @Validator.IsMsString()
    declare public OTP_RESET_TTL: StringValue;

    @Validator.IsMsString()
    declare public OAUTH_STATE_TTL: StringValue;

    @Validator.IsMsString()
    declare public PENDING_2FA_TTL: StringValue;

    @Validator.IsMsString()
    declare public ACCESS_CACHE_TTL: StringValue;

    @Validator.IsMsString()
    declare public REAUTHENTICATION_TTL: StringValue;

    // ---------------------------------------------------------------------------
    // OAuth Providers
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public OAUTH_GOOGLE_CLIENT_ID: string;

    @Validator.IsString()
    declare public OAUTH_GOOGLE_CLIENT_SECRET: string;

    @Validator.IsString()
    declare public OAUTH_GOOGLE_REDIRECT_URI: string;

    @Validator.IsString()
    declare public OAUTH_GITHUB_CLIENT_ID: string;

    @Validator.IsString()
    declare public OAUTH_GITHUB_CLIENT_SECRET: string;

    @Validator.IsString()
    declare public OAUTH_GITHUB_REDIRECT_URI: string;

    // ---------------------------------------------------------------------------
    // AWS (SES/SNS)
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public AWS_REGION: string;

    @Validator.IsString()
    declare public AWS_ACCESS_KEY_ID: string;

    @Validator.IsString()
    declare public AWS_SECRET_ACCESS_KEY: string;

    @Validator.IsString()
    declare public EMAIL_FROM: string;

    // ---------------------------------------------------------------------------
    // BullMQ - cleanup
    // ---------------------------------------------------------------------------

    @Validator.IsMsString()
    declare public INACTIVE_ACCOUNT_TTL: StringValue;

    @Validator.IsMsString()
    declare public PENDING_ACCOUNT_TTL: StringValue;

    @Validator.IsPositiveInt()
    declare public CLEANUP_BATCH_SIZE: number;

    @Validator.IsMsString()
    declare public CLEANUP_BATCH_DELAY: StringValue;

    @Validator.IsMsString()
    declare public CLEANUP_BATCH_BACKOFF_DELAY: StringValue;

    @Validator.IsPositiveInt()
    declare public CLEANUP_BATCH_ATTEMPTS: number;

    // ---------------------------------------------------------------------------
    // Authn & Security
    // ---------------------------------------------------------------------------

    // Hashing (Argon2)
    @Validator.IsString()
    declare public ARGON2_TYPE: string;

    @Validator.IsPositiveInt()
    declare public ARGON2_MEMORY_COST_KIB: number;

    @Validator.IsPositiveInt()
    declare public ARGON2_HASH_LENGTH: number;

    @Validator.IsPositiveInt()
    declare public ARGON2_PARALLELISM: number;

    @Validator.IsPositiveInt()
    declare public ARGON2_TIME_COST: number;

    @Validator.IsPositiveInt()
    declare public ARGON2_VERSION: number;

    // JWT (ES256)
    @Validator.IsString()
    declare public JWT_ISSUER: string;

    @Validator.IsMsString()
    declare public JWT_ACCESS_TTL: StringValue;

    @Validator.IsMsString()
    declare public JWT_REFRESH_TTL: StringValue;

    // Session
    @Validator.IsMsString()
    declare public SESSION_EXPIRY_DAYS: StringValue;

    @Validator.IsMsString()
    declare public PENDING_TOKEN_EXPIRY_MINUTES: StringValue;

    @Validator.IsPositiveInt()
    declare public SESSION_MAX_ACTIVE_COUNT: number;

    // Password
    @Validator.IsMsString()
    declare public PASSWORD_HISTORY_CHECK_DAYS: StringValue;
}
