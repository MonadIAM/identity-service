import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace AuthnCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly commands: globalThis.Commands.Authn.Contract;
                            readonly identifierRepository: {
                                readonly findUnique: jest.Mock<Repositories.Identifier.PublicContract["findUnique"]>;
                                readonly findUniqueOrThrow: jest.Mock<
                                    Repositories.Identifier.PublicContract["findUniqueOrThrow"]
                                >;
                            };
                            readonly secondFactorService: {
                                readonly authenticate: jest.Mock<Services.SecondFactor.CommandContract["authenticate"]>;
                            };
                            readonly oauthCommands: {
                                readonly assertAuthorizationPending: jest.Mock<
                                    globalThis.Commands.OAuth.CommandsContract["assertAuthorizationPending"]
                                >;
                                readonly completeAuthorization: jest.Mock<
                                    globalThis.Commands.OAuth.CommandsContract["completeAuthorization"]
                                >;
                            };
                            readonly pending2FACacheService: {
                                readonly set: jest.Mock<InfrastructureServices.Pending2FACache.PublicContract["set"]>;
                                readonly get: jest.Mock<InfrastructureServices.Pending2FACache.PublicContract["get"]>;
                                readonly delete: jest.Mock<InfrastructureServices.Pending2FACache.PublicContract["delete"]>;
                            };
                            readonly otpCacheService: {
                                readonly set: jest.Mock<InfrastructureServices.OTPCache.PublicContract["set"]>;
                                readonly consume: jest.Mock<InfrastructureServices.OTPCache.PublicContract["consume"]>;
                            };
                            readonly hashingService: {
                                readonly verify: jest.Mock<CommonServices.Hashing.PublicContract["verify"]>;
                            };
                            readonly cryptoService: {
                                readonly generateToken: jest.Mock<CommonServices.Crypto.PublicContract["generateToken"]>;
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
