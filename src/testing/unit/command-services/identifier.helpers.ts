import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class IdentifierCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.Identifier.Contract
{
    public async commands(): Unit.Commands.Identifier.Commands.Result {
        const { IdentifierCommands } = await import("~context/application/commands/identifier.commands.js");
        const execution = this.execution();

        const identifierRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Identifier.PublicContract["findUniqueOrThrow"]>(),
        };
        const identifierService = {
            selectNotificationEmail: jest.fn<Services.Identifier.CommandContract["selectNotificationEmail"]>(),
            create: jest.fn<Services.Identifier.CommandContract["create"]>(),
            verify: jest.fn<Services.Identifier.CommandContract["verify"]>(),
            togglePublicContact: jest.fn<Services.Identifier.CommandContract["togglePublicContact"]>(),
            purge: jest.fn<Services.Identifier.CommandContract["purge"]>(),
        };
        const otpCacheService = {
            set: jest.fn<InfrastructureServices.OTPCache.PublicContract["set"]>(),
            consume: jest.fn<InfrastructureServices.OTPCache.PublicContract["consume"]>(),
        };
        const cryptoService = {
            generateOTP: jest.fn<CommonServices.Crypto.PublicContract["generateOTP"]>(),
        };

        return {
            ...execution,
            identifierRepository,
            identifierService,
            otpCacheService,
            cryptoService,
            commands: new IdentifierCommands(
                execution.transactional,
                this.contract<Repositories.Identifier.PublicContract>(identifierRepository),
                this.contract<Services.Identifier.CommandContract>(identifierService),
                this.contract<InfrastructureServices.OTPCache.PublicContract>(otpCacheService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
            ),
        };
    }
}
