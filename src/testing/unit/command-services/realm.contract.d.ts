import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RealmCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.Realm.Contract;
                        readonly interfaceClientService: {
                            readonly purgeRealm: jest.Mock<Services.InterfaceClient.CommandContract["purgeRealm"]>;
                            readonly applyRealmRevocation: jest.Mock<
                                Services.InterfaceClient.CommandContract["applyRealmRevocation"]
                            >;
                            readonly applyRealmRestore: jest.Mock<
                                Services.InterfaceClient.CommandContract["applyRealmRestore"]
                            >;
                        };
                        readonly serviceClientService: {
                            readonly purgeRealm: jest.Mock<Services.ServiceClient.CommandContract["purgeRealm"]>;
                            readonly applyRealmRevocation: jest.Mock<
                                Services.ServiceClient.CommandContract["applyRealmRevocation"]
                            >;
                            readonly applyRealmRestore: jest.Mock<
                                Services.ServiceClient.CommandContract["applyRealmRestore"]
                            >;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
