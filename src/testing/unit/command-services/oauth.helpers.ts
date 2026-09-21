import type { FastifyReply } from "fastify";
import { jest } from "@jest/globals";

import { OAuthCommands } from "~context/application/commands/oauth.commands";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class OAuthCommandsUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.OAuthCommands.Contract
{
    public commands(): Unit.Application.OAuthCommands.Commands.Result {
        const configService = this.config({
            values: {
                JWT_ISSUER: "https://identity.example.test",
                JWT_ACCESS_TTL: "15m",
            },
        });
        const sessionCommands = {
            refresh: jest.fn<Commands.Session.CommandsContract["refresh"]>(),
            create: jest.fn<Commands.Session.CommandsContract["create"]>(),
            revoke: jest.fn<Commands.Session.CommandsContract["revoke"]>(),
        };
        const authorizationCacheService = {
            consume: jest.fn<InfrastructureServices.AuthorizationCache.PublicContract["consume"]>(),
            create: jest.fn<InfrastructureServices.AuthorizationCache.PublicContract["create"]>(),
            issue: jest.fn<InfrastructureServices.AuthorizationCache.PublicContract["issue"]>(),
            get: jest.fn<InfrastructureServices.AuthorizationCache.PublicContract["get"]>(),
        };
        const interfaceClientRepository = {
            findUniqueOrThrow: jest.fn<Repositories.InterfaceClient.PublicContract["findUniqueOrThrow"]>(),
            findUnique: jest.fn<Repositories.InterfaceClient.PublicContract["findUnique"]>(),
        };
        const cryptoService = {
            verifyCodeChallenge: jest.fn<CommonServices.Crypto.PublicContract["verifyCodeChallenge"]>(),
        };
        const jwtService = {
            verifyRefresh: jest.fn<CommonServices.JWT.PublicContract["verifyRefresh"]>(),
            verifyIdToken: jest.fn<CommonServices.JWT.PublicContract["verifyIdToken"]>(),
        };

        return {
            authorizationCacheService,
            interfaceClientRepository,
            sessionCommands,
            configService,
            cryptoService,
            jwtService,
            commands: new OAuthCommands(
                configService,
                this.contract<Commands.Session.CommandsContract>(sessionCommands),
                this.contract<InfrastructureServices.AuthorizationCache.PublicContract>(authorizationCacheService),
                this.contract<Repositories.InterfaceClient.PublicContract>(interfaceClientRepository),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
                this.contract<CommonServices.JWT.PublicContract>(jwtService),
            ),
        };
    }
    public response(): Unit.Application.OAuthCommands.Response.Result {
        const redirect = jest.fn<FastifyReply["redirect"]>();

        return { response: this.contract<FastifyReply>({ redirect }), redirect };
    }
}
