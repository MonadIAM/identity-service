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

    public async set(
        props: InfrastructureServices.Pending2FACache.Set.Props,
    ): InfrastructureServices.Pending2FACache.Set.Result {
        const { token, metadata } = props;
        await this.redis.set(`${this.namespace}:${token}`, JSON.stringify(metadata), "EX", this.ttl);
    }

    public async get(
        props: InfrastructureServices.Pending2FACache.Get.Props,
    ): InfrastructureServices.Pending2FACache.Get.Result {
        const { token } = props;
        const raw = await this.redis.get(`${this.namespace}:${token}`);
        return raw ? JSON.parse(raw) : null;
    }

    public async delete(
        props: InfrastructureServices.Pending2FACache.Delete.Props,
    ): InfrastructureServices.Pending2FACache.Delete.Result {
        const { token } = props;
        await this.redis.unlink(`${this.namespace}:${token}`);
    }
}
