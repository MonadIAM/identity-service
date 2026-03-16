import { Validator } from "~common/validator";
import { NodeEnv } from "~common/enums";

export class EnvironmentVariablesDTO {
    // ---------------------------------------------------------------------------
    // App
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public SERVICE_NAME!: string;

    @Validator.IsEnum(NodeEnv)
    public NODE_ENV!: NodeEnv;

    @Validator.IsPositiveInt()
    public API_VERSION!: number;

    @Validator.IsString()
    public APP_BASE_IMAGE!: string;

    @Validator.IsString()
    public APP_HOST!: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public APP_PORT!: number;

    @Validator.IsPositiveInt()
    public THROTTLE_LIMIT!: number;

    @Validator.IsPositiveInt()
    public THROTTLE_TTL!: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - common
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public POSTGRES_IMAGE!: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public POSTGRES_PORT!: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public POSTGRES_REPLICA_PORT!: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public POSTGRES_CONTAINER_PORT!: number;

    @Validator.IsString()
    public POSTGRES_USER!: string;

    @Validator.IsString()
    public POSTGRES_PASSWORD!: string;

    @Validator.IsString()
    public POSTGRES_DB!: string;

    @Validator.IsBoolean()
    public POSTGRES_SSL!: boolean;

    @Validator.IsBoolean()
    public POSTGRES_SSL_REJECT_UNAUTHORIZED!: boolean;

    @Validator.IsInt()
    @Validator.Min(0)
    public POSTGRES_POOL_IDLE_MS!: number;

    @Validator.IsPositiveInt()
    public POSTGRES_POOL_MAX!: number;

    @Validator.IsBoolean()
    public POSTGRES_LOGGING!: boolean;

    @Validator.IsBoolean()
    public POSTGRES_CQRS_ENABLED!: boolean;

    // ---------------------------------------------------------------------------
    // PostgreSQL - write-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @Validator.IsOptional()
    public POSTGRES_HOST?: string;

    @Validator.IsString()
    @Validator.IsOptional()
    public POSTGRES_WRITE_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Validator.IsOptional()
    public POSTGRES_WRITE_PORT?: number;

    @Validator.IsPositiveInt()
    public POSTGRES_WRITE_POOL_MAX!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public POSTGRES_WRITE_POOL_IDLE_MS!: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - read-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @Validator.IsOptional()
    public POSTGRES_READ_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Validator.IsOptional()
    public POSTGRES_READ_PORT?: number;

    @Validator.IsPositiveInt()
    public POSTGRES_READ_POOL_MAX!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public POSTGRES_READ_POOL_IDLE_MS!: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - replication
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public POSTGRES_REPLICATION_USER!: string;

    @Validator.IsString()
    public POSTGRES_REPLICATION_PASSWORD!: string;

    @Validator.IsString()
    public POSTGRES_REPLICATION_SLOT!: string;

    // ---------------------------------------------------------------------------
    // Redis
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public REDIS_IMAGE!: string;

    @Validator.IsString()
    @Validator.IsOptional()
    public REDIS_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public REDIS_PORT!: number;

    @Validator.IsString()
    public REDIS_PASSWORD!: string;

    @Validator.IsInt()
    @Validator.Min(0)
    public REDIS_DB_CACHE!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public REDIS_DB_LIMITER!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public REDIS_DB_QUEUE!: number;

    // ---------------------------------------------------------------------------
    // Kafka
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public KAFKA_BROKER!: string;

    @Validator.IsPositiveInt()
    public KAFKA_RETRY_ATTEMPTS!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public KAFKA_RETRY_INITIAL_TIME!: number;

    @Validator.IsString()
    public DOCKER_NETWORK_NAME!: string;

    // ---------------------------------------------------------------------------
    // Auth & Security
    // ---------------------------------------------------------------------------

    // Hashing (Argon2)
    @Validator.IsString()
    public ARGON2_TYPE!: string;

    @Validator.IsPositiveInt()
    public ARGON2_MEMORY_COST_KIB!: number;

    @Validator.IsPositiveInt()
    public ARGON2_HASH_LENGTH!: number;

    @Validator.IsPositiveInt()
    public ARGON2_PARALLELISM!: number;

    @Validator.IsPositiveInt()
    public ARGON2_TIME_COST!: number;

    @Validator.IsPositiveInt()
    public ARGON2_VERSION!: number;

    // JWT (ES256)
    @Validator.IsString()
    public JWT_ISSUER!: string;

    @Validator.IsString()
    public JWT_ACCESS_TTL!: string;

    @Validator.IsString()
    public JWT_REFRESH_TTL!: string;

    @Validator.IsString()
    public JWT_PRIVATE_KEY!: string;

    @Validator.IsString()
    public JWT_PUBLIC_KEY!: string;

    // Session
    @Validator.IsPositiveInt()
    public SESSION_EXPIRY_DAYS!: number;

    // Password
    @Validator.IsPositiveInt()
    public PASSWORD_HISTORY_CHECK_DAYS!: number;

    // ---------------------------------------------------------------------------
    // Cache TTLs
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    public OTP_VERIFICATION_TTL!: number;

    @Validator.IsPositiveInt()
    public OTP_LOGIN_TTL!: number;

    @Validator.IsPositiveInt()
    public OTP_RESET_TTL!: number;

    @Validator.IsPositiveInt()
    public OAUTH_STATE_TTL!: number;

    @Validator.IsPositiveInt()
    public PENDING_2FA_TTL!: number;

    // ---------------------------------------------------------------------------
    // OAuth Providers
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public OAUTH_GOOGLE_CLIENT_ID!: string;

    @Validator.IsString()
    public OAUTH_GOOGLE_CLIENT_SECRET!: string;

    @Validator.IsString()
    public OAUTH_GOOGLE_REDIRECT_URI!: string;

    @Validator.IsString()
    public OAUTH_GITHUB_CLIENT_ID!: string;

    @Validator.IsString()
    public OAUTH_GITHUB_CLIENT_SECRET!: string;

    @Validator.IsString()
    public OAUTH_GITHUB_REDIRECT_URI!: string;

    // ---------------------------------------------------------------------------
    // AWS (SES/SNS)
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public AWS_REGION!: string;

    @Validator.IsString()
    public AWS_ACCESS_KEY_ID!: string;

    @Validator.IsString()
    public AWS_SECRET_ACCESS_KEY!: string;

    @Validator.IsString()
    public EMAIL_FROM!: string;

    // ---------------------------------------------------------------------------
    // BullMQ - cleanup
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    public CLEANUP_BATCH_SIZE!: number;

    @Validator.IsPositiveInt()
    public PENDING_ACCOUNT_TTL_HOURS!: number;

    @Validator.IsPositiveInt()
    public NOTIFICATION_TTL_DAYS!: number;
}
