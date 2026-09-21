import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class PasswordCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.PasswordCommands.Contract
{
    public async commands(): Unit.Application.PasswordCommands.Commands.Result {
        const { PasswordCommands } = await import("~context/application/commands/password.commands.js");
        const execution = this.execution();

        const identifierRepository = {
            findUnique: jest.fn<Repositories.Identifier.PublicContract["findUnique"]>(),
        };
        const passwordService = {
            resetByRecoveryCode: jest.fn<Services.Password.CommandContract["resetByRecoveryCode"]>(),
            resetByOTP: jest.fn<Services.Password.CommandContract["resetByOTP"]>(),
            change: jest.fn<Services.Password.CommandContract["change"]>(),
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
            passwordService,
            otpCacheService,
            cryptoService,
            commands: new PasswordCommands(
                execution.transactional,
                this.contract<Repositories.Identifier.PublicContract>(identifierRepository),
                this.contract<Services.Password.CommandContract>(passwordService),
                this.contract<InfrastructureServices.OTPCache.PublicContract>(otpCacheService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
            ),
        };
    }
}
