import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace InterfaceClientCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.InterfaceClient.Contract;
                        readonly interfaceClientService: {
                            readonly restore: jest.Mock<Services.InterfaceClient.CommandContract["restore"]>;
                            readonly create: jest.Mock<Services.InterfaceClient.CommandContract["create"]>;
                            readonly update: jest.Mock<Services.InterfaceClient.CommandContract["update"]>;
                            readonly revoke: jest.Mock<Services.InterfaceClient.CommandContract["revoke"]>;
                            readonly purge: jest.Mock<Services.InterfaceClient.CommandContract["purge"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
