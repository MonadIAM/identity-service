import { jest } from "@jest/globals";

import { ProfileCommands } from "~context/application/commands/profile.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class ProfileCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.ProfileCommands.Contract
{
    public commands(): Unit.Application.ProfileCommands.Commands.Result {
        const execution = this.execution();

        const profileService = {
            update: jest.fn<Services.Profile.CommandContract["update"]>(),
        };

        return {
            ...execution,
            profileService,
            commands: new ProfileCommands(
                execution.transactional,
                this.contract<Services.Profile.CommandContract>(profileService),
            ),
        };
    }
}
