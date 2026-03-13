import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";

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

    public async set({ state, metadata }: InfrastructureServices.OAuthStateCache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${state}`, JSON.stringify(metadata), "EX", this.ttl);
    }

    public async get({
        state,
    }: InfrastructureServices.OAuthStateCache.Get): Promise<Nullable<InfrastructureServices.OAuthStateCache.Metadata>> {
        const raw = await this.redis.get(`${this.namespace}:${state}`);
        if (raw) {
            return JSON.parse(raw);
        } else {
            return null;
        }
    }

    public async delete({ state }: InfrastructureServices.OAuthStateCache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${state}`);
    }
}
