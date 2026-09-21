import type { ConfigService } from "@nestjs/config";
import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace SessionCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly jwtService: {
                                readonly verifyRefresh: jest.Mock<CommonServices.JWT.PublicContract["verifyRefresh"]>;
                            };
                            readonly cryptoService: {
                                readonly hashToken: jest.Mock<CommonServices.Crypto.PublicContract["hashToken"]>;
                            };
                            readonly sessionService: {
                                readonly revokeAll: jest.Mock<Services.Session.CommandContract["revokeAll"]>;
                                readonly refresh: jest.Mock<Services.Session.CommandContract["refresh"]>;
                                readonly create: jest.Mock<Services.Session.CommandContract["create"]>;
                                readonly revoke: jest.Mock<Services.Session.CommandContract["revoke"]>;
                            };
                            readonly refreshIdempotencyService: {
                                readonly get: jest.Mock<
                                    InfrastructureServices.SessionRefreshIdempotency.PublicContract["get"]
                                >;
                                readonly set: jest.Mock<
                                    InfrastructureServices.SessionRefreshIdempotency.PublicContract["set"]
                                >;
                            };
                            readonly commands: globalThis.Commands.Session.Contract;
                            readonly configService: ConfigService;
                        }
                    >;

                    type Signature = () => Result;
                }
            }
        }
    }
}
