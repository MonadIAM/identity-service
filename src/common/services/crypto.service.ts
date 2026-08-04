import { randomBytes, randomInt, timingSafeEqual, createHash } from "node:crypto";
import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.DEFAULT })
export class CryptoService implements CommonServices.Crypto.Contract {
    public generateToken(props?: CommonServices.Crypto.GenerateToken.Props): CommonServices.Crypto.GenerateToken.Result {
        const { bytes = 32 } = props ?? {};
        return randomBytes(bytes).toString("hex");
    }

    public generateOTP(props?: CommonServices.Crypto.GenerateOTP.Props): CommonServices.Crypto.GenerateOTP.Result {
        const { length = 6 } = props ?? {};
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length);

        return randomInt(min, max).toString();
    }

    public hashToken(props: CommonServices.Crypto.HashToken.Props): CommonServices.Crypto.HashToken.Result {
        const { token } = props;
        return createHash("sha256").update(token).digest("hex");
    }

    public generateRecoveryCode(): CommonServices.Crypto.GenerateRecoveryCode.Result {
        const left = randomBytes(2).toString("hex").toUpperCase();
        const right = randomBytes(2).toString("hex").toUpperCase();

        return `${left}-${right}`;
    }

    public generateRecoveryCodes(
        props?: CommonServices.Crypto.GenerateRecoveryCodes.Props,
    ): CommonServices.Crypto.GenerateRecoveryCodes.Result {
        const { count = 8 } = props ?? {};
        return Array.from({ length: count }, () => this.generateRecoveryCode());
    }

    public verifyCodeChallenge(
        props: CommonServices.Crypto.VerifyCodeChallenge.Props,
    ): CommonServices.Crypto.VerifyCodeChallenge.Result {
        const { verifier, challenge } = props;
        const actual = Buffer.from(createHash("sha256").update(verifier).digest("base64url"));
        const expected = Buffer.from(challenge);

        return actual.length === expected.length && timingSafeEqual(actual, expected);
    }
}
