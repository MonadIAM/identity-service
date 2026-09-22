import { jest } from "@jest/globals";

import { ServiceClientCommands } from "~context/application/commands/service-client.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class ServiceClientCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.ServiceClient.Contract
{
    public commands(): Unit.Commands.ServiceClient.Commands.Result {
        const execution = this.execution();

        const serviceClientService = {
            create: jest.fn<Services.ServiceClient.CommandContract["create"]>(),
            update: jest.fn<Services.ServiceClient.CommandContract["update"]>(),
            revoke: jest.fn<Services.ServiceClient.CommandContract["revoke"]>(),
            restore: jest.fn<Services.ServiceClient.CommandContract["restore"]>(),
            purge: jest.fn<Services.ServiceClient.CommandContract["purge"]>(),
        };

        return {
            ...execution,
            serviceClientService,
            commands: new ServiceClientCommands(
                execution.transactional,
                this.contract<Services.ServiceClient.CommandContract>(serviceClientService),
            ),
        };
    }
}
