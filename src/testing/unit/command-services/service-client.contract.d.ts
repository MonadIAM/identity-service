import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace ServiceClientCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.ServiceClient.Contract;
                        readonly serviceClientService: {
                            readonly restore: jest.Mock<Services.ServiceClient.CommandContract["restore"]>;
                            readonly create: jest.Mock<Services.ServiceClient.CommandContract["create"]>;
                            readonly update: jest.Mock<Services.ServiceClient.CommandContract["update"]>;
                            readonly revoke: jest.Mock<Services.ServiceClient.CommandContract["revoke"]>;
                            readonly purge: jest.Mock<Services.ServiceClient.CommandContract["purge"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
