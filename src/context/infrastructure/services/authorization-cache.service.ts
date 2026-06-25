import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";
import { LuaScript } from "~context/infrastructure/scripts";
import { CRYPTO_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { SCRIPT_EXECUTOR_SERVICE } from "./tokens";

@Injectable()
export class AuthorizationCacheService implements InfrastructureServices.AuthorizationCache.Contract {
    private readonly REQUEST_NAMESPACE = "authorization:request";
    private readonly CODE_NAMESPACE = "authorization:code";
    private readonly requestTTL: number;
    private readonly codeTTL: number;

    public constructor(
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.Contract,
        private readonly configService: ConfigService,
    ) {
        this.requestTTL = ms(this.configService.getOrThrow<StringValue>("AUTHORIZATION_REQUEST_TTL")) / 1e3;
        this.codeTTL = ms(this.configService.getOrThrow<StringValue>("AUTHORIZATION_CODE_TTL")) / 1e3;
    }

    public async create(
        props: InfrastructureServices.AuthorizationCache.Create.Props,
    ): InfrastructureServices.AuthorizationCache.Create.Result {
        const id = this.cryptoService.generateToken();
        await this.redis.set(`${this.REQUEST_NAMESPACE}:${id}`, JSON.stringify(props), "EX", this.requestTTL);
        return { id };
    }

    public async get(
        props: InfrastructureServices.AuthorizationCache.Get.Props,
    ): InfrastructureServices.AuthorizationCache.Get.Result {
        const raw = await this.redis.get(`${this.REQUEST_NAMESPACE}:${props.id}`);
        return raw ? JSON.parse(raw) : null;
    }

    public issue(
        props: InfrastructureServices.AuthorizationCache.Issue.Props,
    ): InfrastructureServices.AuthorizationCache.Issue.Result {
        return this.issueAttempt({ ...props, attemptsRemaining: 3 });
    }

    public async consume(
        props: InfrastructureServices.AuthorizationCache.Consume.Props,
    ): InfrastructureServices.AuthorizationCache.Consume.Result {
        const raw = await this.redis.getdel(`${this.CODE_NAMESPACE}:${props.code}`);
        return raw ? JSON.parse(raw) : null;
    }

    public async issueAttempt(
        props: InfrastructureServices.AuthorizationCache.IssueAttempt.Props,
    ): InfrastructureServices.AuthorizationCache.IssueAttempt.Result {
        const code = this.cryptoService.generateToken();

        const payload: Scripts.IssueCode.Props = {
            account: props.account,
            ttl: this.codeTTL,
        };

        const result: Scripts.IssueCode.Result = JSON.parse(
            await this.scriptExecutorService.execute<string>(
                LuaScript.ISSUE_CODE,
                [JSON.stringify(payload)],
                [`${this.REQUEST_NAMESPACE}:${props.authorizationRequest}`, `${this.CODE_NAMESPACE}:${code}`],
            ),
        );

        if (result.status === "collision") {
            if (props.attemptsRemaining > 1) {
                return this.issueAttempt({ ...props, attemptsRemaining: props.attemptsRemaining - 1 });
            } else {
                throw Exception.badRequest({ messageKey: "Failed to allocate a unique authorization code" });
            }
        } else if (result.status === "issued") {
            return { code, request: result.request };
        } else {
            return null;
        }
    }
}
