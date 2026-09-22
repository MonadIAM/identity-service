import { jest } from "@jest/globals";

import { InterfaceClientCommands } from "~context/application/commands/interface-client.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class InterfaceClientCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.InterfaceClient.Contract
{
    public commands(): Unit.Commands.InterfaceClient.Commands.Result {
        const execution = this.execution();

        const interfaceClientService = {
            restore: jest.fn<Services.InterfaceClient.CommandContract["restore"]>(),
            create: jest.fn<Services.InterfaceClient.CommandContract["create"]>(),
            update: jest.fn<Services.InterfaceClient.CommandContract["update"]>(),
            revoke: jest.fn<Services.InterfaceClient.CommandContract["revoke"]>(),
            purge: jest.fn<Services.InterfaceClient.CommandContract["purge"]>(),
        };

        return {
            ...execution,
            interfaceClientService,
            commands: new InterfaceClientCommands(
                execution.transactional,
                this.contract<Services.InterfaceClient.CommandContract>(interfaceClientService),
            ),
        };
    }
}
