import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

@Injectable()
export class Pending2FACacheService implements InfrastructureServices.Pending2FACache.Contract {
    private readonly namespace = "pending:2fa";
    private readonly ttl: number;

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("PENDING_2FA_TTL")) / 1e3;
    }

    public async set({ token, metadata }: InfrastructureServices.Pending2FACache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${token}`, JSON.stringify(metadata), "EX", this.ttl);
    }

    public async get(
        props: InfrastructureServices.Pending2FACache.Get,
    ): Promise<Nullable<InfrastructureServices.Pending2FACache.Metadata>> {
        const raw = await this.redis.get(`${this.namespace}:${props.token}`);
        return raw ? JSON.parse(raw) : null;
    }

    public async delete({ token }: InfrastructureServices.Pending2FACache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${token}`);
    }
}
