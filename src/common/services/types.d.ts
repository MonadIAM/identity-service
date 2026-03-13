import { Options as ArgonOptions } from "argon2";
import { JWTPayload } from "jose";

declare global {
    namespace CommonServices {
        namespace Hashing {
            type Options = ArgonOptions & { raw?: false };

            interface Contract {
                verifyAndUpgrade: (props: VerifyAndUpgrade.Props) => Promise<VerifyAndUpgrade.Result>;
                verify: (props: Verify) => Promise<boolean>;
                hash: (props: Hash) => Promise<string>;
            }

            type Hash = {
                value: string;
            };

            type Verify = {
                storedHash: string;
                value: string;
            };

            namespace VerifyAndUpgrade {
                type Props = {
                    storedHash: string;
                    value: string;
                };

                type Result = {
                    upgradedHash?: string;
                    isValid: boolean;
                };
            }
        }

        namespace CryptoService {
            interface Contract {
                generateRecoveryCodes: (count?: number) => string[];
                generateToken: (bytes?: number) => string;
                generateOTP: (length?: number) => string;
                generateRecoveryCode: () => string;
            }
        }

        namespace JWTService {
            interface Contract {
                signRefreshToken: (payload: Record<string, unknown>) => Promise<string>;
                signAccessToken: (payload: Record<string, unknown>) => Promise<string>;
                verify: (token: string) => Promise<JWTPayload>;
                initialize: () => Promise<void>;
            }
        }

        namespace EmailService {
            interface Contract {
                send: (props: Send) => Promise<void>;
            }

            type Send = {
                subject: string;
                html: string;
                to: string;
            };
        }

        namespace SMSService {
            interface Contract {
                send: (props: Send) => Promise<void>;
            }

            type Send = {
                body: string;
                to: string;
            };
        }
    }
}
