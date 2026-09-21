import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class AccountCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.AccountCommands.Contract
{
    public async commands(): Unit.Application.AccountCommands.Commands.Result {
        const { AccountCommands } = await import("~context/application/commands/account.commands.js");
        const execution = this.execution();

        const identifierRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Identifier.PublicContract["findUniqueOrThrow"]>(),
        };
        const recoveryCodeService = {
            generate: jest.fn<Services.RecoveryCode.CommandContract["generate"]>(),
        };
        const accountService = {
            create: jest.fn<Services.Account.CommandContract["create"]>(),
            verify: jest.fn<Services.Account.CommandContract["verify"]>(),
            deactivate: jest.fn<Services.Account.CommandContract["deactivate"]>(),
            suspend: jest.fn<Services.Account.CommandContract["suspend"]>(),
            unsuspend: jest.fn<Services.Account.CommandContract["unsuspend"]>(),
        };
        const otpCacheService = {
            set: jest.fn<InfrastructureServices.OTPCache.PublicContract["set"]>(),
            consume: jest.fn<InfrastructureServices.OTPCache.PublicContract["consume"]>(),
        };
        const hashingService = {
            hash: jest.fn<CommonServices.Hashing.PublicContract["hash"]>(),
        };
        const cryptoService = {
            generateOTP: jest.fn<CommonServices.Crypto.PublicContract["generateOTP"]>(),
            generateRecoveryCodes: jest.fn<CommonServices.Crypto.PublicContract["generateRecoveryCodes"]>(),
        };

        return {
            ...execution,
            identifierRepository,
            recoveryCodeService,
            accountService,
            otpCacheService,
            hashingService,
            cryptoService,
            commands: new AccountCommands(
                execution.transactional,
                this.contract<Repositories.Identifier.PublicContract>(identifierRepository),
                this.contract<Services.RecoveryCode.CommandContract>(recoveryCodeService),
                this.contract<Services.Account.CommandContract>(accountService),
                this.contract<InfrastructureServices.OTPCache.PublicContract>(otpCacheService),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
            ),
        };
    }
}
