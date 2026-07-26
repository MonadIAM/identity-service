import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { Module, Global } from "@nestjs/common";
import { isString } from "class-validator";
import ms, { StringValue } from "ms";
import { Redis } from "ioredis";

import { RedisModule, REDIS_LIMITER_CLIENT } from "~infrastructure/redis";

@Global()
@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule, RedisModule],
            inject: [ConfigService, REDIS_LIMITER_CLIENT],
            useFactory: (configService: ConfigService, limiterClient: Redis) => ({
                throttlers: [
                    {
                        ttl: ms(configService.getOrThrow<StringValue>("THROTTLE_TTL")),
                        limit: configService.getOrThrow<number>("THROTTLE_LIMIT"),
                        name: "default",
                    },
                    {
                        getTracker: (req) =>
                            req.session?.account ??
                            (isString(req.body?.identifier) ? req.body.identifier : null) ??
                            (isString(req.body?.authorizationRequest) ? req.body.authorizationRequest : null) ??
                            (isString(req.body?.id) ? req.body.id : null) ??
                            req.ip,
                        name: "account",
                        ttl: ms("1m"),
                        limit: 1e3,
                    },
                ],
                storage: new ThrottlerStorageRedisService(limiterClient),
                errorMessage: "global.throttle",
            }),
        }),
    ],
})
export class RateLimiterModule {}
