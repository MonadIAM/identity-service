import { needsRehash, verify, hash } from "argon2";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Argon2Type } from "~common/enums";

@Injectable({ scope: Scope.DEFAULT })
export class HashingService implements CommonServices.Hashing.Contract {
    private readonly options: CommonServices.Hashing.Options;

    public constructor(private readonly config: ConfigService) {
        this.options = this.buildArgon2Options();
    }

    public hash(props: CommonServices.Hashing.Hash.Props): CommonServices.Hashing.Hash.Result {
        const { value } = props;
        return hash(value, this.options);
    }

    public async verify(props: CommonServices.Hashing.Verify.Props): CommonServices.Hashing.Verify.Result {
        try {
            const { value, storedHash } = props;
            return await verify(storedHash, value);
        } catch {
            return false;
        }
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

        return { isValid: true, upgradedHash: await hash(value, this.options) };
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
