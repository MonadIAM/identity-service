import { Options as ArgonOptions } from "argon2";

declare global {
    namespace CommonServices {
        namespace Hashing {
            type Options = ArgonOptions & { raw?: false };

            type VerifyAndUpgrade = {
                upgradedHash?: string;
                isValid: boolean;
            };
        }
    }
}
