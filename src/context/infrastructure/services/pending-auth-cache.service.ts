import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";

@Injectable()
export class PendingAuthCacheService implements InfrastructureServices.PendingAuthCache.Contract {
    private readonly ttl: number;
    private readonly namespace = "pending:2fa";

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("PENDING_2FA_TTL"));
    }

    public async set({ token, account }: InfrastructureServices.PendingAuthCache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${token}`, account, "EX", this.ttl);
    }

    public async get({ token }: InfrastructureServices.PendingAuthCache.Get): Promise<Nullable<string>> {
        return await this.redis.get(`${this.namespace}:${token}`);
    }

    public async delete({ token }: InfrastructureServices.PendingAuthCache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${token}`);
    }
}
