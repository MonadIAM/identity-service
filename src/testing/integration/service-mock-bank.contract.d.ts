declare namespace Integration {
    namespace ServiceMockBank {
        interface Contract {
            readonly secondFactorSecret: SecondFactorSecret.Signature;
            readonly logMasking: LogMasking.Signature;
            readonly hashing: Hashing.Signature;
            readonly outbox: Outbox.Signature;
            readonly crypto: Crypto.Signature;
            readonly totp: TOTP.Signature;
            readonly jwt: JWT.Signature;
        }

        namespace LogMasking {
            type Signature = () => ServiceMocks.LogMasking;
        }

        namespace Outbox {
            type Signature = () => ServiceMocks.Outbox;
        }

        namespace Hashing {
            type Signature = () => ServiceMocks.Hashing;
        }

        namespace Crypto {
            type Signature = () => ServiceMocks.Crypto;
        }

        namespace SecondFactorSecret {
            type Signature = () => ServiceMocks.SecondFactorSecret;
        }

        namespace TOTP {
            type Signature = () => ServiceMocks.TOTP;
        }

        namespace JWT {
            type Signature = () => ServiceMocks.JWT;
        }
    }

    namespace ServiceMocks {
        interface LogMasking extends TransactionManager.LogMasking.Contract {}

        interface Outbox extends TransactionManager.Outbox.Contract {}

        interface Hashing extends CommonServices.Hashing.PublicContract {
            readonly hashedValues: string[];
        }

        interface Crypto extends CommonServices.Crypto.Contract {}

        interface SecondFactorSecret extends InfrastructureServices.SecondFactorSecret.Contract {
            setResolvedCiphertext: SecondFactorSecret.SetResolvedCiphertext.Signature;
        }

        namespace SecondFactorSecret {
            namespace SetResolvedCiphertext {
                type Signature = (ciphertext?: string) => void;
            }
        }

        interface TOTP extends CommonServices.TOTP.Contract {
            setStep: TOTP.SetStep.Signature;
            reject: TOTP.Reject.Signature;
        }

        namespace TOTP {
            namespace SetStep {
                type Signature = (step: number) => void;
            }

            namespace Reject {
                type Signature = () => void;
            }
        }

        interface JWT extends CommonServices.JWT.Contract {
            readonly refreshPayloads: CommonServices.JWT.SignRefreshToken.Props[];
            readonly accessPayloads: CommonServices.JWT.SignAccessToken.Props[];
            readonly idPayloads: CommonServices.JWT.SignIdToken.Props[];

            setFailure: JWT.SetFailure.Signature;
        }

        namespace JWT {
            type Failure = "refresh" | "access" | "id";

            namespace SetFailure {
                type Signature = (failure?: Failure) => void;
            }
        }
    }
}
