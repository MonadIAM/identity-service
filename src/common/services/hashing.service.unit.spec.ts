import { describe, expect, it, jest, beforeAll } from "@jest/globals";
import { needsRehash, verify, hash } from "argon2";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";
import { Argon2Type } from "~common/enums";

import type { HashingService as HashingServiceType } from "./hashing.service";
import execute from "./hashing.worker";

const run = jest.fn((request: CommonServices.Hashing.Worker.Request) => Promise.resolve().then(() => execute(request)));
const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

jest.unstable_mockModule("piscina", () => ({
    Piscina: jest.fn().mockImplementation(() => ({ run, close })),
}));

let HashingService: typeof HashingServiceType;

beforeAll(async () => {
    ({ HashingService } = await import("~common/services/hashing.service.js"));
});

function service(type = Argon2Type.ARGON2ID, timeCost = 2): HashingServiceType {
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

describe("[CommonService] - Hashing", () => {
    describe("[Behavior] - password hashing", () => {
        it.each([Argon2Type.ARGON2D, Argon2Type.ARGON2I, Argon2Type.ARGON2ID])(
            "[case] - uses configured %s parameters and verifies the password",
            async (type) => {
                // Arrange
                const hashing = service(type);
                const value = "Password 🔐";

                // Act
                const storedHash = await hashing.hash({ value });
                const valid = await hashing.verify({ storedHash, value });
                const invalid = await hashing.verify({ storedHash, value: "wrong" });
                const result = storedHash.split("$").slice(1, 3);
                const result1 = storedHash.split("$")[3].split(",").sort();
                const result2 = Buffer.from(storedHash.split("$")[5], "base64");

                // Assert
                expect(result).toEqual([type, "v=19"]);
                expect(result1).toEqual(["m=1024", "p=1", "t=2"]);
                expect(result2).toHaveLength(24);
                expect(valid).toBe(true);
                expect(invalid).toBe(false);
                expect(await verify(storedHash, value)).toBe(true);
            },
        );
    });

    describe("[Method] - verify", () => {
        it.each([16, 19])("[case] - accepts existing hashes with version %s", async (version) => {
            // Arrange
            const hashing = service();
            const storedHash = await hash("password", { memoryCost: 1024, timeCost: 2, parallelism: 1, version });

            // Act
            const result = await hashing.verify({ storedHash, value: "password" });

            // Assert
            expect(result).toBe(true);
        });

        it("[case] - propagates worker failure instead of rejecting a valid password", async () => {
            // Arrange
            const hashing = service();
            const storedHash = await hashing.hash({ value: "password" });
            const error = Exception.internal({ messageKey: "services.hashing.WORKER_FAILED" });
            run.mockRejectedValueOnce(error);

            // Act
            const result = hashing.verify({ storedHash, value: "password" });

            // Assert
            await expect(result).rejects.toMatchObject({
                messageKey: "services.hashing.WORKER_FAILED",
                cause: error,
            });
        });

        it("[case] - treats malformed stored hashes as failed verification", async () => {
            // Arrange
            const hashing = service();

            // Act
            const result = await hashing.verify({ storedHash: "not-an-argon2-hash", value: "password" });

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("[Method] - onApplicationShutdown", () => {
        it("[case] - closes the worker pool", async () => {
            // Arrange
            const hashing = service();

            // Act
            await hashing.onApplicationShutdown();

            // Assert
            expect(close).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - verifyAndUpgrade", () => {
        it("[case] - does not upgrade a hash for an incorrect password", async () => {
            // Arrange
            const storedHash = await service().hash({ value: "correct" });
            const hashing = service(Argon2Type.ARGON2ID, 3);

            // Act
            const result = await hashing.verifyAndUpgrade({ storedHash, value: "wrong" });

            // Assert
            expect(result).toEqual({ isValid: false });
        });

        it("[case] - does not replace a hash that already uses current parameters", async () => {
            // Arrange
            const hashing = service();
            const storedHash = await hashing.hash({ value: "correct" });

            // Act
            const result = await hashing.verifyAndUpgrade({ storedHash, value: "correct" });

            // Assert
            expect(result).toEqual({ isValid: true });
        });

        it("[case] - upgrades an accepted password when the configured cost changes", async () => {
            // Arrange
            const storedHash = await service().hash({ value: "correct" });
            const hashing = service(Argon2Type.ARGON2ID, 3);

            // Act
            const result = await hashing.verifyAndUpgrade({ storedHash, value: "correct" });
            const result1 = await verify(result.upgradedHash!, "correct");
            const result2 = needsRehash(result.upgradedHash!, { memoryCost: 1024, timeCost: 3, parallelism: 1 });

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.upgradedHash).not.toBe(storedHash);
            expect(result1).toBe(true);
            expect(result2).toBe(false);
        });
    });
});
