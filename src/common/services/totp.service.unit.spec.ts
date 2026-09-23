import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Secret, TOTP } from "otpauth";

import { TOTPService } from "./totp.service";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const service = new TOTPService();
const timestamp = 59000;

describe("TOTPService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("creates a 20-byte base32 secret", () => {
        const result = service.createSecret();

        expect(result).toMatch(/^[A-Z2-7]{32}$/);
        expect(Secret.fromBase32(result).buffer.byteLength).toBe(20);
    });

    it("builds an authenticator URI with escaped label and configured parameters", () => {
        const uri = new URL(service.createURI({ secret, label: "user+test@example.com" }));

        expect(uri.protocol).toBe("otpauth:");
        expect(uri.host).toBe("totp");
        expect(decodeURIComponent(uri.pathname)).toBe("/MonadIAM:user+test@example.com");
        expect(Object.fromEntries(uri.searchParams)).toEqual({
            secret,
            issuer: "MonadIAM",
            algorithm: "SHA1",
            digits: "6",
            period: "30",
        });
    });

    it("matches the six-digit SHA1 RFC test vector", () => {
        const generator = service.generate({ secret });

        const code = generator.generate({ timestamp });

        expect(code).toBe("287082");
    });

    it.each([-1, 0, 1])("accepts a code from time-step delta %s and returns its absolute step", (delta) => {
        jest.spyOn(Date, "now").mockReturnValue(timestamp);
        const code = TOTP.generate({
            secret: Secret.fromBase32(secret),
            timestamp: timestamp + delta * 30000,
            digits: 6,
            period: 30,
            algorithm: "SHA1",
        });

        const result = service.verify({ secret, code });

        expect(result).toEqual({ step: Math.floor(timestamp / 30000) + delta });
    });

    it.each([-2, 2])("rejects a code outside the permitted time window: %s", (delta) => {
        const now = timestamp + 120000;
        jest.spyOn(Date, "now").mockReturnValue(now);
        const code = TOTP.generate({
            secret: Secret.fromBase32(secret),
            timestamp: now + delta * 30000,
            digits: 6,
            period: 30,
            algorithm: "SHA1",
        });

        const result = service.verify({ secret, code });

        expect(result).toBeNull();
    });

    it.each(["", "123", "abcdef", "1234567"])("rejects malformed code %s", (code) => {
        jest.spyOn(Date, "now").mockReturnValue(timestamp);

        const result = service.verify({ secret, code });

        expect(result).toBeNull();
    });
});
