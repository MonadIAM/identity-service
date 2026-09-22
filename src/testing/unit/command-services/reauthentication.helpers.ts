import { jest } from "@jest/globals";

import { ReauthenticationCommands } from "~context/application/commands/reauthentication.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class ReauthenticationCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.Reauthentication.Contract
{
    public commands(): Unit.Commands.Reauthentication.Commands.Result {
        const execution = this.execution();

        const accountRepository = {
            findUniqueOrThrow: jest.fn<Repositories.Account.PublicContract["findUniqueOrThrow"]>(),
        };
        const hashingService = {
            verify: jest.fn<CommonServices.Hashing.PublicContract["verify"]>(),
        };
        const secondFactorService = {
            reauthenticate: jest.fn<Services.SecondFactor.CommandContract["reauthenticate"]>(),
        };
        const configService = this.config({
            values: {
                REAUTHENTICATION_TTL: "5m",
            },
        });

        return {
            ...execution,
            secondFactorService,
            accountRepository,
            hashingService,
            configService,
            commands: new ReauthenticationCommands(
                execution.transactional,
                this.contract<Repositories.Account.PublicContract>(accountRepository),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<Services.SecondFactor.CommandContract>(secondFactorService),
                configService,
            ),
        };
    }
}
