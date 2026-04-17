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

    @Validator.IsPositiveInt()
    declare public THROTTLE_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public THROTTLE_TTL: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - common
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_IMAGE: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_REPLICA_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_CONTAINER_PORT: number;

    @Validator.IsString()
    declare public POSTGRES_USER: string;

    @Validator.IsString()
    declare public POSTGRES_PASSWORD: string;

    @Validator.IsString()
    declare public POSTGRES_DB: string;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL: boolean;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL_REJECT_UNAUTHORIZED: boolean;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public POSTGRES_POOL_IDLE_MS: number;

    @Validator.IsPositiveInt()
    declare public POSTGRES_POOL_MAX: number;

    @Validator.IsBoolean()
    declare public POSTGRES_LOGGING: boolean;

    @Validator.IsBoolean()
    declare public POSTGRES_CQRS_ENABLED: boolean;

    // ---------------------------------------------------------------------------
    // PostgreSQL - write-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @Validator.IsOptional()
    declare public POSTGRES_HOST?: string;

    @Validator.IsString()
    @Validator.IsOptional()
    declare public POSTGRES_WRITE_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Validator.IsOptional()
    declare public POSTGRES_WRITE_PORT?: number;

    @Validator.IsPositiveInt()
    declare public POSTGRES_WRITE_POOL_MAX: number;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public POSTGRES_WRITE_POOL_IDLE_MS: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - read-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @Validator.IsOptional()
    declare public POSTGRES_READ_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Validator.IsOptional()
    declare public POSTGRES_READ_PORT?: number;

    @Validator.IsPositiveInt()
    declare public POSTGRES_READ_POOL_MAX: number;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public POSTGRES_READ_POOL_IDLE_MS: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - replication
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_USER: string;

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_PASSWORD: string;

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_SLOT: string;

    // ---------------------------------------------------------------------------
    // Redis
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public REDIS_IMAGE: string;

    @Validator.IsString()
    @Validator.IsOptional()
    declare public REDIS_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public REDIS_PORT: number;

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

    @Validator.IsInt()
    @Validator.Min(0)
    declare public KAFKA_RETRY_INITIAL_TIME: number;

    @Validator.IsString()
    declare public DOCKER_NETWORK_NAME: string;

    // ---------------------------------------------------------------------------
    // Auth & Security
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

    @Validator.IsString()
    declare public JWT_ACCESS_TTL: string;

    @Validator.IsString()
    declare public JWT_REFRESH_TTL: string;

    @Validator.IsString()
    declare public JWT_PRIVATE_KEY: string;

    @Validator.IsString()
    declare public JWT_PUBLIC_KEY: string;

    // Session
    @Validator.IsPositiveInt()
    declare public SESSION_EXPIRY_DAYS: number;

    // Password
    @Validator.IsPositiveInt()
    declare public PASSWORD_HISTORY_CHECK_DAYS: number;

    // ---------------------------------------------------------------------------
    // Cache TTLs
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    declare public OTP_VERIFICATION_TTL: number;

    @Validator.IsPositiveInt()
    declare public OTP_LOGIN_TTL: number;

    @Validator.IsPositiveInt()
    declare public OTP_RESET_TTL: number;

    @Validator.IsPositiveInt()
    declare public OAUTH_STATE_TTL: number;

    @Validator.IsPositiveInt()
    declare public PENDING_2FA_TTL: number;

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

    @Validator.IsPositiveInt()
    declare public CLEANUP_BATCH_SIZE: number;

    @Validator.IsPositiveInt()
    declare public PENDING_ACCOUNT_TTL_HOURS: number;

    @Validator.IsPositiveInt()
    declare public NOTIFICATION_TTL_DAYS: number;
}
