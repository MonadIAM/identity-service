import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace AccountCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly commands: globalThis.Commands.Account.Contract;
                            readonly identifierRepository: {
                                readonly findUniqueOrThrow: jest.Mock<
                                    Repositories.Identifier.PublicContract["findUniqueOrThrow"]
                                >;
                            };
                            readonly recoveryCodeService: {
                                readonly generate: jest.Mock<Services.RecoveryCode.CommandContract["generate"]>;
                            };
                            readonly accountService: {
                                readonly create: jest.Mock<Services.Account.CommandContract["create"]>;
                                readonly verify: jest.Mock<Services.Account.CommandContract["verify"]>;
                                readonly deactivate: jest.Mock<Services.Account.CommandContract["deactivate"]>;
                                readonly suspend: jest.Mock<Services.Account.CommandContract["suspend"]>;
                                readonly unsuspend: jest.Mock<Services.Account.CommandContract["unsuspend"]>;
                            };
                            readonly otpCacheService: {
                                readonly set: jest.Mock<InfrastructureServices.OTPCache.PublicContract["set"]>;
                                readonly consume: jest.Mock<InfrastructureServices.OTPCache.PublicContract["consume"]>;
                            };
                            readonly hashingService: {
                                readonly hash: jest.Mock<CommonServices.Hashing.PublicContract["hash"]>;
                            };
                            readonly cryptoService: {
                                readonly generateOTP: jest.Mock<CommonServices.Crypto.PublicContract["generateOTP"]>;
                                readonly generateRecoveryCodes: jest.Mock<
                                    CommonServices.Crypto.PublicContract["generateRecoveryCodes"]
                                >;
                            };
                        }
                    >;

                    type Signature = () => Result;
                }
            }
        }
    }
}
