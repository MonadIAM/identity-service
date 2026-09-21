import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace ProfileCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.Profile.Contract;
                        readonly profileService: {
                            readonly update: jest.Mock<Services.Profile.CommandContract["update"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
