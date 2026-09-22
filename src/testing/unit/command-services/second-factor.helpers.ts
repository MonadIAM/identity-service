import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class SecondFactorCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.SecondFactor.Contract
{
    public async commands(): Unit.Commands.SecondFactor.Commands.Result {
        const { SecondFactorCommands } = await import("~context/application/commands/second-factor.commands.js");
        const execution = this.execution();

        const secondFactorSecretService = {
            encrypt: jest.fn<InfrastructureServices.SecondFactorSecret.PublicContract["encrypt"]>(),
        };
        const secondFactorService = {
            create: jest.fn<Services.SecondFactor.CommandContract["create"]>(),
            verify: jest.fn<Services.SecondFactor.CommandContract["verify"]>(),
            reset: jest.fn<Services.SecondFactor.CommandContract["reset"]>(),
            purge: jest.fn<Services.SecondFactor.CommandContract["purge"]>(),
        };
        const hashingService = {
            hash: jest.fn<CommonServices.Hashing.PublicContract["hash"]>(),
        };
        const cryptoService = {
            generateRecoveryCode: jest.fn<CommonServices.Crypto.PublicContract["generateRecoveryCode"]>(),
        };
        const totpService = {
            createSecret: jest.fn<CommonServices.TOTP.PublicContract["createSecret"]>(),
            createURI: jest.fn<CommonServices.TOTP.PublicContract["createURI"]>(),
        };

        return {
            ...execution,
            secondFactorSecretService,
            secondFactorService,
            hashingService,
            cryptoService,
            totpService,
            commands: new SecondFactorCommands(
                this.contract<InfrastructureServices.SecondFactorSecret.PublicContract>(secondFactorSecretService),
                execution.transactional,
                this.contract<Services.SecondFactor.CommandContract>(secondFactorService),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
                this.contract<CommonServices.TOTP.PublicContract>(totpService),
            ),
        };
    }
}
