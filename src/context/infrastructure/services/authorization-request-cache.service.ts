import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";
import { CRYPTO_SERVICE } from "~common/services";

@Injectable()
export class AuthorizationRequestCacheService implements InfrastructureServices.AuthorizationRequestCache.Contract {
    private readonly namespace = "authorization:request";
    private readonly ttl: number;

    public constructor(
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.ttl = ms(this.configService.getOrThrow<StringValue>("AUTHORIZATION_REQUEST_TTL")) / 1e3;
    }

    public async create(
        props: InfrastructureServices.AuthorizationRequestCache.Create.Props,
    ): InfrastructureServices.AuthorizationRequestCache.Create.Result {
        const id = this.cryptoService.generateToken();
        await this.redis.set(`${this.namespace}:${id}`, JSON.stringify(props), "EX", this.ttl);
        return { id };
    }

    public async get(
        props: InfrastructureServices.AuthorizationRequestCache.Get.Props,
    ): InfrastructureServices.AuthorizationRequestCache.Get.Result {
        return this.deserialize(await this.redis.get(`${this.namespace}:${props.id}`));
    }

    public async confirm(
        props: InfrastructureServices.AuthorizationRequestCache.Confirm.Props,
    ): InfrastructureServices.AuthorizationRequestCache.Confirm.Result {
        const metadata = await this.get({ id: props.id });

        if (metadata) {
            await this.redis.set(
                `${this.namespace}:${props.id}`,
                JSON.stringify({ ...metadata, account: props.account }),
                "EX",
                this.ttl,
            );
        }
    }

    public async consume(
        props: InfrastructureServices.AuthorizationRequestCache.Consume.Props,
    ): InfrastructureServices.AuthorizationRequestCache.Consume.Result {
        return this.deserialize(await this.redis.getdel(`${this.namespace}:${props.id}`));
    }

    public async delete(
        props: InfrastructureServices.AuthorizationRequestCache.Delete.Props,
    ): InfrastructureServices.AuthorizationRequestCache.Delete.Result {
        await this.redis.unlink(`${this.namespace}:${props.id}`);
    }

    public deserialize(raw: Nullable<string>): Nullable<InfrastructureServices.AuthorizationRequestCache.Metadata> {
        return raw ? JSON.parse(raw) : null;
    }
}
