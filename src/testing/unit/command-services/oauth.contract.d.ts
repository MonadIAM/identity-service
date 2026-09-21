import type { FastifyReply } from "fastify";
import type { ConfigService } from "@nestjs/config";
import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace OAuthCommands {
                interface Contract extends Domain.Core.Contract {
                    readonly commands: Commands.Signature;
                    readonly response: Response.Signature;
                }

                namespace Response {
                    type Result = {
                        readonly response: FastifyReply;
                        readonly redirect: jest.Mock<FastifyReply["redirect"]>;
                    };

                    type Signature = () => Result;
                }

                namespace Commands {
                    type Result = {
                        readonly commands: globalThis.Commands.OAuth.Contract;
                        readonly configService: ConfigService;
                        readonly sessionCommands: {
                            readonly refresh: jest.Mock<globalThis.Commands.Session.CommandsContract["refresh"]>;
                            readonly create: jest.Mock<globalThis.Commands.Session.CommandsContract["create"]>;
                            readonly revoke: jest.Mock<globalThis.Commands.Session.CommandsContract["revoke"]>;
                        };
                        readonly authorizationCacheService: {
                            readonly create: jest.Mock<InfrastructureServices.AuthorizationCache.PublicContract["create"]>;
                            readonly issue: jest.Mock<InfrastructureServices.AuthorizationCache.PublicContract["issue"]>;
                            readonly get: jest.Mock<InfrastructureServices.AuthorizationCache.PublicContract["get"]>;
                            readonly consume: jest.Mock<
                                InfrastructureServices.AuthorizationCache.PublicContract["consume"]
                            >;
                        };
                        readonly interfaceClientRepository: {
                            readonly findUnique: jest.Mock<Repositories.InterfaceClient.PublicContract["findUnique"]>;
                            readonly findUniqueOrThrow: jest.Mock<
                                Repositories.InterfaceClient.PublicContract["findUniqueOrThrow"]
                            >;
                        };
                        readonly cryptoService: {
                            readonly verifyCodeChallenge: jest.Mock<
                                CommonServices.Crypto.PublicContract["verifyCodeChallenge"]
                            >;
                        };
                        readonly jwtService: {
                            readonly verifyRefresh: jest.Mock<CommonServices.JWT.PublicContract["verifyRefresh"]>;
                            readonly verifyIdToken: jest.Mock<CommonServices.JWT.PublicContract["verifyIdToken"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
