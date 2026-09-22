import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class AuthnCommandsUnitHelpers extends ApplicationCommandUnitHelpers implements Unit.Commands.Authn.Contract {
    public async commands(): Unit.Commands.Authn.Commands.Result {
        const { AuthnCommands } = await import("~context/application/commands/authn.commands.js");
        const execution = this.execution();

        const identifierRepository = {
            findUnique: jest.fn<Repositories.Identifier.PublicContract["findUnique"]>(),
            findUniqueOrThrow: jest.fn<Repositories.Identifier.PublicContract["findUniqueOrThrow"]>(),
        };
        const secondFactorService = {
            authenticate: jest.fn<Services.SecondFactor.CommandContract["authenticate"]>(),
        };
        const oauthCommands = {
            assertAuthorizationPending: jest.fn<Commands.OAuth.CommandsContract["assertAuthorizationPending"]>(),
            completeAuthorization: jest.fn<Commands.OAuth.CommandsContract["completeAuthorization"]>(),
        };
        const pending2FACacheService = {
            set: jest.fn<InfrastructureServices.Pending2FACache.PublicContract["set"]>(),
            get: jest.fn<InfrastructureServices.Pending2FACache.PublicContract["get"]>(),
            delete: jest.fn<InfrastructureServices.Pending2FACache.PublicContract["delete"]>(),
        };
        const otpCacheService = {
            set: jest.fn<InfrastructureServices.OTPCache.PublicContract["set"]>(),
            consume: jest.fn<InfrastructureServices.OTPCache.PublicContract["consume"]>(),
        };
        const hashingService = {
            verify: jest.fn<CommonServices.Hashing.PublicContract["verify"]>(),
        };
        const cryptoService = {
            generateToken: jest.fn<CommonServices.Crypto.PublicContract["generateToken"]>(),
            generateOTP: jest.fn<CommonServices.Crypto.PublicContract["generateOTP"]>(),
        };

        return {
            ...execution,
            pending2FACacheService,
            identifierRepository,
            secondFactorService,
            otpCacheService,
            hashingService,
            cryptoService,
            oauthCommands,
            commands: new AuthnCommands(
                execution.transactional,
                this.contract<Repositories.Identifier.PublicContract>(identifierRepository),
                this.contract<Services.SecondFactor.CommandContract>(secondFactorService),
                this.contract<Commands.OAuth.CommandsContract>(oauthCommands),
                this.contract<InfrastructureServices.Pending2FACache.PublicContract>(pending2FACacheService),
                this.contract<InfrastructureServices.OTPCache.PublicContract>(otpCacheService),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
            ),
        };
    }
}
