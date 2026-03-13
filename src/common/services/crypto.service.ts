import { randomBytes, randomInt } from "node:crypto";
import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.DEFAULT })
export class CryptoService implements CommonServices.CryptoService.Contract {
    public generateToken(bytes = 32): string {
        return randomBytes(bytes).toString("hex");
    }

    public generateOTP(length = 6): string {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length);

        return randomInt(min, max).toString();
    }

    public generateRecoveryCode(): string {
        const left = randomBytes(2).toString("hex").toUpperCase();
        const right = randomBytes(2).toString("hex").toUpperCase();

        return `${left}-${right}`;
    }

    public generateRecoveryCodes(count = 8): string[] {
        return Array.from({ length: count }, () => this.generateRecoveryCode());
    }
}
