import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";

@Injectable()
export class Pending2FACacheService implements InfrastructureServices.Pending2FACache.Contract {
    private readonly namespace = "pending:2fa";
    private readonly ttl: number;

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("PENDING_2FA_TTL"));
    }

    public async set({ token, account }: InfrastructureServices.Pending2FACache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${token}`, account, "EX", this.ttl);
    }

    public async get({ token }: InfrastructureServices.Pending2FACache.Get): Promise<Nullable<string>> {
        return await this.redis.get(`${this.namespace}:${token}`);
    }

    public async delete({ token }: InfrastructureServices.Pending2FACache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${token}`);
    }
}
