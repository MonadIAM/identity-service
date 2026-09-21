import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace SecondFactorCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly commands: globalThis.Commands.SecondFactor.Contract;
                            readonly secondFactorSecretService: {
                                readonly encrypt: jest.Mock<
                                    InfrastructureServices.SecondFactorSecret.PublicContract["encrypt"]
                                >;
                            };
                            readonly secondFactorService: {
                                readonly create: jest.Mock<Services.SecondFactor.CommandContract["create"]>;
                                readonly verify: jest.Mock<Services.SecondFactor.CommandContract["verify"]>;
                                readonly reset: jest.Mock<Services.SecondFactor.CommandContract["reset"]>;
                                readonly purge: jest.Mock<Services.SecondFactor.CommandContract["purge"]>;
                            };
                            readonly hashingService: {
                                readonly hash: jest.Mock<CommonServices.Hashing.PublicContract["hash"]>;
                            };
                            readonly cryptoService: {
                                readonly generateRecoveryCode: jest.Mock<
                                    CommonServices.Crypto.PublicContract["generateRecoveryCode"]
                                >;
                            };
                            readonly totpService: {
                                readonly createSecret: jest.Mock<CommonServices.TOTP.PublicContract["createSecret"]>;
                                readonly createURI: jest.Mock<CommonServices.TOTP.PublicContract["createURI"]>;
                            };
                        }
                    >;

                    type Signature = () => Result;
                }
            }
        }
    }
}
