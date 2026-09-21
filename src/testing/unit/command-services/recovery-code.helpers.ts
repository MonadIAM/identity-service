import { jest } from "@jest/globals";

import { RecoveryCodeCommands } from "~context/application/commands/recovery-code.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RecoveryCodeCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.RecoveryCodeCommands.Contract
{
    public commands(): Unit.Application.RecoveryCodeCommands.Commands.Result {
        const execution = this.execution();

        const cryptoService = {
            generateRecoveryCodes: jest.fn<CommonServices.Crypto.PublicContract["generateRecoveryCodes"]>(),
        };
        const recoveryCodeService = {
            regenerate: jest.fn<Services.RecoveryCode.CommandContract["regenerate"]>(),
        };
        const hashingService = {
            hash: jest.fn<CommonServices.Hashing.PublicContract["hash"]>(),
        };

        return {
            ...execution,
            recoveryCodeService,
            hashingService,
            cryptoService,
            commands: new RecoveryCodeCommands(
                execution.transactional,
                this.contract<Services.RecoveryCode.CommandContract>(recoveryCodeService),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
            ),
        };
    }
}
