import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { needsRehash, verify } from "argon2";

import { Argon2Type } from "~common/enums";

import { HashingService } from "./hashing.service";

function service(type = Argon2Type.ARGON2ID, timeCost = 2): HashingService {
    return new HashingService(
        new ConfigService({
            ARGON2_TYPE: type,
            ARGON2_MEMORY_COST_KIB: 1024,
            ARGON2_TIME_COST: timeCost,
            ARGON2_HASH_LENGTH: 24,
            ARGON2_PARALLELISM: 1,
            ARGON2_VERSION: 19,
        }),
    );
}

describe("HashingService", () => {
    it.each([Argon2Type.ARGON2D, Argon2Type.ARGON2I, Argon2Type.ARGON2ID])(
        "uses configured %s parameters and verifies the password",
        async (type) => {
            const hashing = service(type);
            const value = "Password 🔐";

            const storedHash = await hashing.hash({ value });
            const valid = await hashing.verify({ storedHash, value });
            const invalid = await hashing.verify({ storedHash, value: "wrong" });

            expect(storedHash.split("$").slice(1, 3)).toEqual([type, "v=19"]);
            expect(storedHash.split("$")[3].split(",").sort()).toEqual(["m=1024", "p=1", "t=2"]);
            expect(Buffer.from(storedHash.split("$")[5], "base64")).toHaveLength(24);
            expect(valid).toBe(true);
            expect(invalid).toBe(false);
        },
    );

    it("treats malformed stored hashes as failed verification", async () => {
        const hashing = service();

        const result = await hashing.verify({ storedHash: "not-an-argon2-hash", value: "password" });

        expect(result).toBe(false);
    });

    it("does not upgrade a hash for an incorrect password", async () => {
        const storedHash = await service().hash({ value: "correct" });
        const hashing = service(Argon2Type.ARGON2ID, 3);

        const result = await hashing.verifyAndUpgrade({ storedHash, value: "wrong" });

        expect(result).toEqual({ isValid: false });
    });

    it("does not replace a hash that already uses current parameters", async () => {
        const hashing = service();
        const storedHash = await hashing.hash({ value: "correct" });

        const result = await hashing.verifyAndUpgrade({ storedHash, value: "correct" });

        expect(result).toEqual({ isValid: true });
    });

    it("upgrades an accepted password when the configured cost changes", async () => {
        const storedHash = await service().hash({ value: "correct" });
        const hashing = service(Argon2Type.ARGON2ID, 3);

        const result = await hashing.verifyAndUpgrade({ storedHash, value: "correct" });

        expect(result.isValid).toBe(true);
        expect(result.upgradedHash).not.toBe(storedHash);
        expect(await verify(result.upgradedHash!, "correct")).toBe(true);
        expect(needsRehash(result.upgradedHash!, { memoryCost: 1024, timeCost: 3, parallelism: 1 })).toBe(false);
    });
});
