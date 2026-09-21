import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace PasswordCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly commands: globalThis.Commands.Password.Contract;
                            readonly identifierRepository: {
                                readonly findUnique: jest.Mock<Repositories.Identifier.PublicContract["findUnique"]>;
                            };
                            readonly passwordService: {
                                readonly resetByOTP: jest.Mock<Services.Password.CommandContract["resetByOTP"]>;
                                readonly change: jest.Mock<Services.Password.CommandContract["change"]>;
                                readonly resetByRecoveryCode: jest.Mock<
                                    Services.Password.CommandContract["resetByRecoveryCode"]
                                >;
                            };
                            readonly otpCacheService: {
                                readonly consume: jest.Mock<InfrastructureServices.OTPCache.PublicContract["consume"]>;
                                readonly set: jest.Mock<InfrastructureServices.OTPCache.PublicContract["set"]>;
                            };
                            readonly cryptoService: {
                                readonly generateOTP: jest.Mock<CommonServices.Crypto.PublicContract["generateOTP"]>;
                            };
                        }
                    >;

                    type Signature = () => Result;
                }
            }
        }
    }
}
