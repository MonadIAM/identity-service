import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";

@Injectable()
export class OAuthStateCacheService implements InfrastructureServices.OAuthStateCache.Contract {
    private readonly namespace = "oauth:state";
    private readonly ttl: number;

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = this.configService.getOrThrow<number>("OAUTH_STATE_TTL");
    }

    public async set(
        props: InfrastructureServices.OAuthStateCache.Set.Props,
    ): InfrastructureServices.OAuthStateCache.Set.Result {
        const { state, metadata } = props;
        await this.redis.set(`${this.namespace}:${state}`, JSON.stringify(metadata), "EX", this.ttl);
    }

    public async consume(
        props: InfrastructureServices.OAuthStateCache.Consume.Props,
    ): InfrastructureServices.OAuthStateCache.Consume.Result {
        const { state } = props;
        const raw = await this.redis.getdel(`${this.namespace}:${state}`);

        if (raw) {
            return JSON.parse(raw);
        } else {
            return null;
        }
    }
}
