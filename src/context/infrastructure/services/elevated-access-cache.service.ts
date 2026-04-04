import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";

@Injectable()
export class ElevatedAccessCacheService implements InfrastructureServices.ElevatedAccessCache.Contract {
    private readonly ttl: number;
    private readonly namespace = "elevated-access";

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = this.configService.getOrThrow<number>("ELEVATED_ACCESS_TTL");
    }

    public async set({ account }: InfrastructureServices.ElevatedAccessCache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${account}`, "1", "EX", this.ttl);
    }

    public async exists({ account }: InfrastructureServices.ElevatedAccessCache.Exists): Promise<boolean> {
        return (await this.redis.exists(`${this.namespace}:${account}`)) === 1;
    }

    public async delete({ account }: InfrastructureServices.ElevatedAccessCache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${account}`);
    }
}
