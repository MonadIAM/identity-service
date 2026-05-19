import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";

@Injectable()
export class OTPCacheService implements InfrastructureServices.OTPCache.Contract {
    private readonly namespace = "otp";

    private readonly ttl: Record<InfrastructureServices.OTPCache.Purpose, number>;

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = {
            verification: this.configService.getOrThrow<number>("OTP_VERIFICATION_TTL"),
            identifier: this.configService.getOrThrow<number>("OTP_VERIFICATION_TTL"),
            setup2FA: this.configService.getOrThrow<number>("PENDING_2FA_TTL"),
            login: this.configService.getOrThrow<number>("OTP_LOGIN_TTL"),
            reset: this.configService.getOrThrow<number>("OTP_RESET_TTL"),
        };
    }

    public async set(props: InfrastructureServices.OTPCache.Set.Props): InfrastructureServices.OTPCache.Set.Result {
        const { purpose, value, key } = props;
        await this.redis.set(`${this.namespace}:${purpose}:${key}`, value, "EX", this.ttl[purpose]);
    }

    public async consume(
        props: InfrastructureServices.OTPCache.Consume.Props,
    ): InfrastructureServices.OTPCache.Consume.Result {
        const { purpose, key } = props;
        return await this.redis.getdel(`${this.namespace}:${purpose}:${key}`);
    }
}
