import { jest } from "@jest/globals";

import { PasswordCommands } from "~context/application/commands/password.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class PasswordCommandsUnitHelpers extends ApplicationCommandUnitHelpers implements Unit.Commands.Password.Contract {
    public commands(): Unit.Commands.Password.Commands.Result {
        const execution = this.execution();

        const identifierRepository = {
            findUnique: jest.fn<Repositories.Identifier.PublicContract["findUnique"]>(),
        };
        const hashingService = {
            hash: jest.fn<CommonServices.Hashing.PublicContract["hash"]>(),
        };
        const passwordService = {
            set: jest.fn<Services.Password.CommandContract["set"]>(),
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
            hashingService,
            passwordService,
            otpCacheService,
            cryptoService,
            commands: new PasswordCommands(
                execution.transactional,
                this.contract<Repositories.Identifier.PublicContract>(identifierRepository),
                this.contract<Services.Password.CommandContract>(passwordService),
                this.contract<InfrastructureServices.OTPCache.PublicContract>(otpCacheService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
            ),
        };
    }
}
