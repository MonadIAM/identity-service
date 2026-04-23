declare namespace NodeJS {
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
        THROTTLE_LIMIT: `${number}`;
        THROTTLE_TTL: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - common
        // ---------------------------------------------------------------------------

        POSTGRES_IMAGE: string;
        POSTGRES_PORT: `${number}`;
        POSTGRES_REPLICA_PORT: `${number}`;
        POSTGRES_CONTAINER_PORT: `${number}`;
        POSTGRES_USER: string;
        POSTGRES_DB: string;
        POSTGRES_PASSWORD: string;
        POSTGRES_SSL: "true" | "false";
        POSTGRES_SSL_REJECT_UNAUTHORIZED: "true" | "false";
        POSTGRES_POOL_IDLE_MS: `${number}`;
        POSTGRES_POOL_MAX: `${number}`;
        POSTGRES_LOGGING: "true" | "false";
        POSTGRES_CQRS_ENABLED: "true" | "false";

        // ---------------------------------------------------------------------------
        // PostgreSQL - write-side (set by docker-compose, not in .env)
        // ---------------------------------------------------------------------------

        POSTGRES_HOST?: string;
        POSTGRES_WRITE_HOST?: string;
        POSTGRES_WRITE_PORT?: `${number}`;
        POSTGRES_WRITE_POOL_MAX: `${number}`;
        POSTGRES_WRITE_POOL_IDLE_MS: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - read-side (host/port set by docker-compose, not in .env)
        // ---------------------------------------------------------------------------

        POSTGRES_READ_HOST?: string;
        POSTGRES_READ_PORT?: `${number}`;
        POSTGRES_READ_POOL_MAX: `${number}`;
        POSTGRES_READ_POOL_IDLE_MS: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - replication
        // ---------------------------------------------------------------------------

        POSTGRES_REPLICATION_USER: string;
        POSTGRES_REPLICATION_PASSWORD: string;
        POSTGRES_REPLICATION_SLOT: string;

        // ---------------------------------------------------------------------------
        // Redis
        // ---------------------------------------------------------------------------

        REDIS_IMAGE: string;
        REDIS_HOST?: string;
        REDIS_PORT: `${number}`;
        REDIS_PASSWORD: string;
        REDIS_DB_CACHE: `${number}`;
        REDIS_DB_LIMITER: `${number}`;
        REDIS_DB_QUEUE: `${number}`;

        // ---------------------------------------------------------------------------
        // Kafka
        // ---------------------------------------------------------------------------

        KAFKA_BROKER: string;
        KAFKA_RETRY_ATTEMPTS: `${number}`;
        KAFKA_RETRY_INITIAL_TIME: `${number}`;
        DOCKER_NETWORK_NAME: string;
        KAFKA_CONNECT_IMAGE: string;

        // ---------------------------------------------------------------------------
        // Auth & Security
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
        JWT_ACCESS_TTL: `${number}m`;
        JWT_REFRESH_TTL: `${number}d`;
        JWT_PRIVATE_KEY: string;
        JWT_PUBLIC_KEY: string;

        // Session
        SESSION_EXPIRY_DAYS: `${number}`;

        // Password
        PASSWORD_HISTORY_CHECK_DAYS: `${number}`;

        // ---------------------------------------------------------------------------
        // Cache TTLs
        // ---------------------------------------------------------------------------

        OTP_VERIFICATION_TTL: `${number}`;
        OTP_LOGIN_TTL: `${number}`;
        OTP_RESET_TTL: `${number}`;
        OAUTH_STATE_TTL: `${number}`;
        PENDING_2FA_TTL: `${number}`;

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

        CLEANUP_BATCH_SIZE: `${number}`;
        PENDING_ACCOUNT_TTL_HOURS: `${number}`;
        NOTIFICATION_TTL_DAYS: `${number}`;
    }
}
