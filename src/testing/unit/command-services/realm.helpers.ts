import { jest } from "@jest/globals";

import { RealmCommands } from "~context/application/commands/realm.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RealmCommandsUnitHelpers extends ApplicationCommandUnitHelpers implements Unit.Commands.Realm.Contract {
    public commands(): Unit.Commands.Realm.Commands.Result {
        const execution = this.execution();

        const interfaceClientService = {
            applyRealmRevocation: jest.fn<Services.InterfaceClient.CommandContract["applyRealmRevocation"]>(),
            applyRealmRestore: jest.fn<Services.InterfaceClient.CommandContract["applyRealmRestore"]>(),
            purgeRealm: jest.fn<Services.InterfaceClient.CommandContract["purgeRealm"]>(),
        };
        const serviceClientService = {
            applyRealmRevocation: jest.fn<Services.ServiceClient.CommandContract["applyRealmRevocation"]>(),
            applyRealmRestore: jest.fn<Services.ServiceClient.CommandContract["applyRealmRestore"]>(),
            purgeRealm: jest.fn<Services.ServiceClient.CommandContract["purgeRealm"]>(),
        };

        return {
            ...execution,
            interfaceClientService,
            serviceClientService,
            commands: new RealmCommands(
                execution.transactional,
                this.contract<Services.InterfaceClient.CommandContract>(interfaceClientService),
                this.contract<Services.ServiceClient.CommandContract>(serviceClientService),
            ),
        };
    }
}
