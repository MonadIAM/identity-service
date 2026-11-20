import { Injectable, Scope, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { needsRehash } from "argon2";
import { Piscina } from "piscina";
import { join } from "node:path";

import { Exception } from "~common/exceptions";
import { Argon2Type } from "~common/enums";

@Injectable({ scope: Scope.DEFAULT })
export class HashingService implements CommonServices.Hashing.Contract, OnApplicationShutdown {
    private readonly dictionaryPath = "services.hashing";
    private readonly options: CommonServices.Hashing.Options;
    private readonly worker = new Piscina<CommonServices.Hashing.Worker.Request, CommonServices.Hashing.Worker.Response>({
        filename: join(__dirname, "hashing.worker.js"),
        minThreads: 2,
        maxThreads: 2,
        maxQueue: 512,
        execArgv: [],
        recordTiming: false,
    });

    public constructor(private readonly config: ConfigService) {
        this.options = this.buildArgon2Options();
    }

    public async hash(props: CommonServices.Hashing.Hash.Props): CommonServices.Hashing.Hash.Result {
        const { value } = props;
        const result = await this.execute({ operation: "hash", value, options: this.options });
        if (result.operation !== "hash") {
            throw Exception.internal({ messageKey: `${this.dictionaryPath}.INVALID_WORKER_RESPONSE` });
        }
        return result.value;
    }

    public async verify(props: CommonServices.Hashing.Verify.Props): CommonServices.Hashing.Verify.Result {
        const { value, storedHash } = props;
        const result = await this.execute({ operation: "verify", value, storedHash });
        if (result.operation !== "verify") {
            throw Exception.internal({ messageKey: `${this.dictionaryPath}.INVALID_WORKER_RESPONSE` });
        }
        return result.value;
    }

    public async verifyAndUpgrade(
        props: CommonServices.Hashing.VerifyAndUpgrade.Props,
    ): CommonServices.Hashing.VerifyAndUpgrade.Result {
        const { storedHash, value } = props;
        const isValid = await this.verify({ value, storedHash });

        if (!isValid) {
            return { isValid: false };
        }

        if (!needsRehash(storedHash, this.options)) {
            return { isValid: true };
        }

        return { isValid: true, upgradedHash: await this.hash({ value }) };
    }

    public async onApplicationShutdown(): Promise<void> {
        await this.worker.close();
    }

    private async execute(request: CommonServices.Hashing.Worker.Request): Promise<CommonServices.Hashing.Worker.Result> {
        try {
            const response = await this.worker.run(request);
            return response.result;
        } catch (cause) {
            throw Exception.internal({ messageKey: `${this.dictionaryPath}.WORKER_FAILED`, cause });
        }
    }

    private buildArgon2Options(): CommonServices.Hashing.Options {
        return {
            type: this.resolveType(this.config.getOrThrow<Argon2Type>("ARGON2_TYPE")),

            memoryCost: this.config.getOrThrow<number>("ARGON2_MEMORY_COST_KIB"),
            parallelism: this.config.getOrThrow<number>("ARGON2_PARALLELISM"),
            timeCost: this.config.getOrThrow<number>("ARGON2_TIME_COST"),

            hashLength: this.config.getOrThrow<number>("ARGON2_HASH_LENGTH"),
            version: this.config.getOrThrow<number>("ARGON2_VERSION"),
        };
    }

    private resolveType(type: Argon2Type): CommonServices.Hashing.Options["type"] {
        switch (type) {
            case Argon2Type.ARGON2D:
                return 0;
            case Argon2Type.ARGON2I:
                return 1;
            default:
                return 2;
        }
    }
}
