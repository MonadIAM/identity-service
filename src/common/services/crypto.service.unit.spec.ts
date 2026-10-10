import { describe, expect, it } from "@jest/globals";

import { CryptoService } from "./crypto.service";

const service = new CryptoService();

describe("[CommonService] - Crypto", () => {
    describe("[Method] - generateToken", () => {
        it.each([
            { label: "default options", props: undefined, size: 32 },
            { label: "empty options", props: {}, size: 32 },
            { label: "custom size", props: { bytes: 16 }, size: 16 },
        ])("[case] - creates a $size-byte hex token with $label", ({ props, size }) => {
            // Arrange

            // Act
            const token = service.generateToken(props);
            const result = Buffer.from(token, "hex");

            // Assert
            expect(token).toMatch(new RegExp(`^[a-f0-9]{${size * 2}}$`));
            expect(result).toHaveLength(size);
        });
    });

    describe("[Method] - generateOTP", () => {
        it.each([
            { label: "default options", props: undefined, size: 6 },
            { label: "empty options", props: {}, size: 6 },
            { label: "single digit", props: { length: 1 }, size: 1 },
            { label: "custom length", props: { length: 8 }, size: 8 },
        ])("[case] - creates a $size-digit OTP without a leading zero: $label", ({ props, size }) => {
            // Arrange

            // Act
            const code = service.generateOTP(props);

            // Assert
            expect(code).toMatch(new RegExp(`^[1-9][0-9]{${size - 1}}$`));
        });
    });

    describe("[Method] - hashToken", () => {
        it("[case] - hashes a token using the known SHA-256 test vector", () => {
            // Arrange

            // Act
            const result = service.hashToken({ token: "abc" });

            // Assert
            expect(result).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        });
    });

    describe("[Method] - generateRecoveryCode", () => {
        it("[case] - creates recovery codes in two uppercase hexadecimal groups", () => {
            // Arrange

            // Act
            const code = service.generateRecoveryCode();

            // Assert
            expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
        });
    });

    describe("[Method] - generateRecoveryCodes", () => {
        it.each([
            { label: "default options", props: undefined, count: 8 },
            { label: "empty options", props: {}, count: 8 },
            { label: "custom count", props: { count: 3 }, count: 3 },
            { label: "zero count", props: { count: 0 }, count: 0 },
        ])("[case] - creates $count recovery codes with $label", ({ props, count }) => {
            // Arrange

            // Act
            const codes = service.generateRecoveryCodes(props);

            // Assert
            expect(codes).toHaveLength(count);
            for (const code of codes) {
                expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
            }
        });
    });

    describe("[Method] - verifyCodeChallenge", () => {
        it.each([
            { label: "matching", challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", valid: true },
            { label: "mismatched", challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cN", valid: false },
            { label: "short", challenge: "short", valid: false },
            { label: "empty", challenge: "", valid: false },
        ])("[case] - validates a $label PKCE S256 challenge", ({ challenge, valid }) => {
            // Arrange
            const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

            // Act
            const result = service.verifyCodeChallenge({ verifier, challenge });

            // Assert
            expect(result).toBe(valid);
        });
    });
});
