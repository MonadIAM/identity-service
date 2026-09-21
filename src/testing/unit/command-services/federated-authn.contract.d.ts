import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace FederatedAuthnCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly commands: globalThis.Commands.FederatedAuthn.Contract;
                            readonly oauthStateCacheService: {
                                readonly set: jest.Mock<InfrastructureServices.OAuthStateCache.PublicContract["set"]>;
                                readonly consume: jest.Mock<
                                    InfrastructureServices.OAuthStateCache.PublicContract["consume"]
                                >;
                            };
                            readonly identifierRepository: {
                                readonly findUnique: jest.Mock<Repositories.Identifier.PublicContract["findUnique"]>;
                            };
                            readonly recoveryCodeService: {
                                readonly generate: jest.Mock<Services.RecoveryCode.CommandContract["generate"]>;
                            };
                            readonly identifierService: {
                                readonly create: jest.Mock<Services.Identifier.CommandContract["create"]>;
                            };
                            readonly sessionService: {
                                readonly create: jest.Mock<Services.Session.CommandContract["create"]>;
                            };
                            readonly accountService: {
                                readonly create: jest.Mock<Services.Account.CommandContract["create"]>;
                            };
                            readonly googleOAuthService: {
                                readonly exchangeCode: jest.Mock<CommonServices.GoogleOAuth.PublicContract["exchangeCode"]>;
                                readonly fetchProfile: jest.Mock<CommonServices.GoogleOAuth.PublicContract["fetchProfile"]>;
                                readonly getAuthorizationUrl: jest.Mock<
                                    CommonServices.GoogleOAuth.PublicContract["getAuthorizationUrl"]
                                >;
                            };
                            readonly githubOAuthService: {
                                readonly exchangeCode: jest.Mock<CommonServices.GitHubOAuth.PublicContract["exchangeCode"]>;
                                readonly fetchProfile: jest.Mock<CommonServices.GitHubOAuth.PublicContract["fetchProfile"]>;
                                readonly getAuthorizationUrl: jest.Mock<
                                    CommonServices.GitHubOAuth.PublicContract["getAuthorizationUrl"]
                                >;
                            };
                            readonly hashingService: {
                                readonly hash: jest.Mock<CommonServices.Hashing.PublicContract["hash"]>;
                            };
                            readonly cryptoService: {
                                readonly generateToken: jest.Mock<CommonServices.Crypto.PublicContract["generateToken"]>;
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
