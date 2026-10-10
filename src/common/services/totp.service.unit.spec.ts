import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Secret, TOTP } from "otpauth";

import { TOTPService } from "./totp.service";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const service = new TOTPService();
const timestamp = 59000;

describe("[CommonService] - TOTP", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - createSecret", () => {
        it("[case] - creates a 20-byte base32 secret", () => {
            // Arrange

            // Act
            const result = service.createSecret();
            const result1 = Secret.fromBase32(result).buffer.byteLength;

            // Assert
            expect(result).toMatch(/^[A-Z2-7]{32}$/);
            expect(result1).toBe(20);
        });
    });

    describe("[Method] - createURI", () => {
        it("[case] - builds an authenticator URI with escaped label and configured parameters", () => {
            // Arrange

            // Act
            const uri = new URL(service.createURI({ secret, label: "user+test@example.com" }));
            const result = decodeURIComponent(uri.pathname);
            const result1 = Object.fromEntries(uri.searchParams);

            // Assert
            expect(uri.protocol).toBe("otpauth:");
            expect(uri.host).toBe("totp");
            expect(result).toBe("/MonadIAM:user+test@example.com");
            expect(result1).toEqual({
                secret,
                issuer: "MonadIAM",
                algorithm: "SHA1",
                digits: "6",
                period: "30",
            });
        });
    });

    describe("[Method] - generate", () => {
        it("[case] - matches the six-digit SHA1 RFC test vector", () => {
            // Arrange

            // Act
            const generator = service.generate({ secret });
            const code = generator.generate({ timestamp });

            // Assert
            expect(code).toBe("287082");
        });
    });

    describe("[Method] - verify", () => {
        it.each([-1, 0, 1])("[case] - accepts a code from time-step delta %s and returns its absolute step", (delta) => {
            // Arrange
            jest.spyOn(Date, "now").mockReturnValue(timestamp);
            const code = TOTP.generate({
                secret: Secret.fromBase32(secret),
                timestamp: timestamp + delta * 30000,
                digits: 6,
                period: 30,
                algorithm: "SHA1",
            });

            // Act
            const result = service.verify({ secret, code });

            // Assert
            expect(result).toEqual({ step: Math.floor(timestamp / 30000) + delta });
        });

        it.each([-2, 2])("[case] - rejects a code outside the permitted time window: %s", (delta) => {
            // Arrange
            const now = timestamp + 120000;
            jest.spyOn(Date, "now").mockReturnValue(now);
            const code = TOTP.generate({
                secret: Secret.fromBase32(secret),
                timestamp: now + delta * 30000,
                digits: 6,
                period: 30,
                algorithm: "SHA1",
            });

            // Act
            const result = service.verify({ secret, code });

            // Assert
            expect(result).toBeNull();
        });

        it.each(["", "123", "abcdef", "1234567"])("[case] - rejects malformed code %s", (code) => {
            // Arrange
            jest.spyOn(Date, "now").mockReturnValue(timestamp);

            // Act
            const result = service.verify({ secret, code });

            // Assert
            expect(result).toBeNull();
        });
    });
});
