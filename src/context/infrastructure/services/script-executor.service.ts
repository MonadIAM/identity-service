import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

import { SCRIPT_LOADER_SERVICE } from "./tokens";
import { LuaScript } from "../scripts";

@Injectable()
export class ScriptExecutorService implements InfrastructureServices.ScriptExecutor.Contract {
    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        @Inject(SCRIPT_LOADER_SERVICE)
        private readonly scriptLoaderService: InfrastructureServices.ScriptLoader.Contract,
    ) {}

    public async execute<T>(
        props: InfrastructureServices.ScriptExecutor.Execute.Props,
    ): InfrastructureServices.ScriptExecutor.Execute.Result<T> {
        const { script, args, keys = [] } = props;
        try {
            return await this.evalsha<T>(script, keys, args);
        } catch (error) {
            if (error instanceof Error && error.message.includes("NOSCRIPT")) {
                await this.scriptLoaderService.reload(script);
                return this.evalsha<T>(script, keys, args);
            } else {
                throw error;
            }
        }
    }

    private evalsha<T>(script: LuaScript, keys: string[], args: string[]): Promise<T> {
        return this.redis.evalsha(this.scriptLoaderService.getHash(script), keys.length, ...keys, ...args) as Promise<T>;
    }
}
