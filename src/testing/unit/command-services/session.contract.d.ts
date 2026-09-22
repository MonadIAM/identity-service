import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Unit.Commands.Session {
        interface Contract extends Core.Contract {
            commands: Commands.Signature;
        }

        namespace Commands {
            type Result = Promise<
                Core.Execution.Result & {
                    jwtService: Jest.Mocked<Pick<CommonServices.JWT.PublicContract, "verifyRefresh">>;
                    cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "hashToken">>;
                    sessionService: Jest.Mocked<
                        Pick<Services.Session.CommandContract, "revokeAll" | "refresh" | "create" | "revoke">
                    >;
                    refreshIdempotencyService: Jest.Mocked<
                        Pick<InfrastructureServices.SessionRefreshIdempotency.PublicContract, "get" | "set">
                    >;
                    commands: globalThis.Commands.Session.Contract;
                    configService: ConfigService;
                }
            >;

            type Signature = () => Result;
        }
    }
}
