import { describe, expect, it } from "@jest/globals";

import { CryptoService } from "./crypto.service";

const service = new CryptoService();

describe("CryptoService", () => {
    it.each([
        { props: undefined, size: 32 },
        { props: {}, size: 32 },
        { props: { bytes: 16 }, size: 16 },
    ])("creates a hexadecimal token containing $size bytes", ({ props, size }) => {
        const token = service.generateToken(props);

        expect(token).toMatch(new RegExp(`^[a-f0-9]{${size * 2}}$`));
        expect(Buffer.from(token, "hex")).toHaveLength(size);
    });

    it.each([
        { props: undefined, size: 6 },
        { props: {}, size: 6 },
        { props: { length: 1 }, size: 1 },
        { props: { length: 8 }, size: 8 },
    ])("creates an OTP with exactly $size digits and no leading zero", ({ props, size }) => {
        const code = service.generateOTP(props);

        expect(code).toMatch(new RegExp(`^[1-9][0-9]{${size - 1}}$`));
    });

    it("hashes a token using the known SHA-256 test vector", () => {
        const result = service.hashToken({ token: "abc" });

        expect(result).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });

    it("creates recovery codes in two uppercase hexadecimal groups", () => {
        const code = service.generateRecoveryCode();

        expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    it.each([
        { props: undefined, count: 8 },
        { props: {}, count: 8 },
        { props: { count: 3 }, count: 3 },
        { props: { count: 0 }, count: 0 },
    ])("creates $count recovery codes", ({ props, count }) => {
        const codes = service.generateRecoveryCodes(props);

        expect(codes).toHaveLength(count);
        for (const code of codes) {
            expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
        }
    });

    it.each([
        { challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", valid: true },
        { challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cN", valid: false },
        { challenge: "short", valid: false },
        { challenge: "", valid: false },
    ])("checks the PKCE S256 challenge $challenge", ({ challenge, valid }) => {
        const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

        const result = service.verifyCodeChallenge({ verifier, challenge });

        expect(result).toBe(valid);
    });
});
