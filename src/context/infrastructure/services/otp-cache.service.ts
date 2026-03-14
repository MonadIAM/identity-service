import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";

@Injectable()
export class OTPCacheService implements InfrastructureServices.OTPCache.Contract {
    private readonly namespace = "otp";

    private readonly verificationTTL: number;
    private readonly loginTTL: number;
    private readonly resetTTL: number;

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.verificationTTL = this.configService.getOrThrow<number>("OTP_VERIFICATION_TTL");
        this.loginTTL = this.configService.getOrThrow<number>("OTP_LOGIN_TTL");
        this.resetTTL = this.configService.getOrThrow<number>("OTP_RESET_TTL");
    }

    public async setVerification({ code, account }: InfrastructureServices.OTPCache.SetVerification): Promise<void> {
        await this.redis.set(`${this.namespace}:verification:${code}`, account, "EX", this.verificationTTL);
    }

    public async getVerification({ code }: InfrastructureServices.OTPCache.GetVerification): Promise<Nullable<string>> {
        return await this.redis.get(`${this.namespace}:verification:${code}`);
    }

    public async deleteVerification({ code }: InfrastructureServices.OTPCache.DeleteVerification): Promise<void> {
        await this.redis.unlink(`${this.namespace}:verification:${code}`);
    }

    public async setLogin({ code, identifier }: InfrastructureServices.OTPCache.SetLogin): Promise<void> {
        await this.redis.set(`${this.namespace}:login:${code}`, identifier, "EX", this.loginTTL);
    }

    public async getLogin({ code }: InfrastructureServices.OTPCache.GetLogin): Promise<Nullable<string>> {
        return await this.redis.get(`${this.namespace}:login:${code}`);
    }

    public async deleteLogin({ code }: InfrastructureServices.OTPCache.DeleteLogin): Promise<void> {
        await this.redis.unlink(`${this.namespace}:login:${code}`);
    }

    public async setReset({ code, account }: InfrastructureServices.OTPCache.SetReset): Promise<void> {
        await this.redis.set(`${this.namespace}:reset:${code}`, account, "EX", this.resetTTL);
    }

    public async getReset({ code }: InfrastructureServices.OTPCache.GetReset): Promise<Nullable<string>> {
        return await this.redis.get(`${this.namespace}:reset:${code}`);
    }

    public async deleteReset({ code }: InfrastructureServices.OTPCache.DeleteReset): Promise<void> {
        await this.redis.unlink(`${this.namespace}:reset:${code}`);
    }

    public async setIdentifier({ code, data }: InfrastructureServices.OTPCache.SetIdentifier): Promise<void> {
        await this.redis.set(`${this.namespace}:identifier:${code}`, JSON.stringify(data), "EX", this.verificationTTL);
    }

    public async getIdentifier({
        code,
    }: InfrastructureServices.OTPCache.GetIdentifier): Promise<Nullable<InfrastructureServices.OTPCache.IdentifierData>> {
        const raw = await this.redis.get(`${this.namespace}:identifier:${code}`);
        if (raw) {
            return JSON.parse(raw);
        } else {
            return null;
        }
    }

    public async deleteIdentifier({ code }: InfrastructureServices.OTPCache.DeleteIdentifier): Promise<void> {
        await this.redis.unlink(`${this.namespace}:identifier:${code}`);
    }
}
