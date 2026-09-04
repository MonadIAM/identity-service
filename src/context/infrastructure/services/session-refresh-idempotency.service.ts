import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

@Injectable()
export class SessionRefreshIdempotencyService implements InfrastructureServices.SessionRefreshIdempotency.Contract {
    private readonly namespace = "session:refresh-idempotency";
    private readonly ttl: number;

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("SESSION_REFRESH_IDEMPOTENCY_TTL")) / 1e3;
    }

    public async get(
        props: InfrastructureServices.SessionRefreshIdempotency.Get.Props,
    ): InfrastructureServices.SessionRefreshIdempotency.Get.Result {
        const raw = await this.redis.get(`${this.namespace}:${props.key}`);

        if (raw) {
            return JSON.parse(raw);
        } else {
            return null;
        }
    }

    public async set(
        props: InfrastructureServices.SessionRefreshIdempotency.Set.Props,
    ): InfrastructureServices.SessionRefreshIdempotency.Set.Result {
        const { key, result } = props;
        await this.redis.set(`${this.namespace}:${key}`, JSON.stringify(result), "EX", this.ttl);
    }
}
