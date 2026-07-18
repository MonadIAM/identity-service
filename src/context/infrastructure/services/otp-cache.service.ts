import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";

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
            verification: ms(this.configService.getOrThrow<StringValue>("OTP_VERIFICATION_TTL")) / 1e3,
            identifier: ms(this.configService.getOrThrow<StringValue>("OTP_VERIFICATION_TTL")) / 1e3,
            setup2FA: ms(this.configService.getOrThrow<StringValue>("PENDING_2FA_TTL")) / 1e3,
            login: ms(this.configService.getOrThrow<StringValue>("OTP_LOGIN_TTL")) / 1e3,
            reset: ms(this.configService.getOrThrow<StringValue>("OTP_RESET_TTL")) / 1e3,
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
