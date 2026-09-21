import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace IdentifierCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly commands: globalThis.Commands.Identifier.Contract;
                            readonly identifierRepository: {
                                readonly findUniqueOrThrow: jest.Mock<
                                    Repositories.Identifier.PublicContract["findUniqueOrThrow"]
                                >;
                            };
                            readonly identifierService: {
                                readonly create: jest.Mock<Services.Identifier.CommandContract["create"]>;
                                readonly verify: jest.Mock<Services.Identifier.CommandContract["verify"]>;
                                readonly togglePublicContact: jest.Mock<
                                    Services.Identifier.CommandContract["togglePublicContact"]
                                >;
                                readonly purge: jest.Mock<Services.Identifier.CommandContract["purge"]>;
                            };
                            readonly otpCacheService: {
                                readonly set: jest.Mock<InfrastructureServices.OTPCache.PublicContract["set"]>;
                                readonly consume: jest.Mock<InfrastructureServices.OTPCache.PublicContract["consume"]>;
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
