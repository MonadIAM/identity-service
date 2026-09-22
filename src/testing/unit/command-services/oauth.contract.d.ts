import type { ConfigService } from "@nestjs/config";
import type { FastifyReply } from "fastify";

declare global {
    namespace Unit.Commands.OAuth {
        interface Contract extends Domain.Core.Contract {
            commands: Commands.Signature;
            response: Response.Signature;
        }

        namespace Response {
            type Result = {
                response: FastifyReply;
                redirect: Jest.Mock<FastifyReply["redirect"]>;
            };

            type Signature = () => Result;
        }

        namespace Commands {
            type Result = {
                commands: globalThis.Commands.OAuth.Contract;
                configService: ConfigService;
                sessionCommands: {
                    refresh: Jest.Mock<globalThis.Commands.Session.CommandsContract["refresh"]>;
                    create: Jest.Mock<globalThis.Commands.Session.CommandsContract["create"]>;
                    revoke: Jest.Mock<globalThis.Commands.Session.CommandsContract["revoke"]>;
                };
                authorizationCacheService: Jest.Mocked<
                    Pick<InfrastructureServices.AuthorizationCache.PublicContract, "create" | "issue" | "get" | "consume">
                >;
                interfaceClientRepository: {
                    findUnique: Jest.Mock<Repositories.InterfaceClient.PublicContract["findUnique"]>;
                    findUniqueOrThrow: Jest.Mock<Repositories.InterfaceClient.PublicContract["findUniqueOrThrow"]>;
                };
                cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "verifyCodeChallenge">>;
                jwtService: Jest.Mocked<Pick<CommonServices.JWT.PublicContract, "verifyRefresh" | "verifyIdToken">>;
            };

            type Signature = () => Result;
        }
    }
}
