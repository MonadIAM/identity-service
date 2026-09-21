import type { ConfigService } from "@nestjs/config";
import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace ReauthenticationCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly accountRepository: {
                            readonly findUniqueOrThrow: jest.Mock<Repositories.Account.PublicContract["findUniqueOrThrow"]>;
                        };
                        readonly secondFactorService: {
                            readonly reauthenticate: jest.Mock<Services.SecondFactor.CommandContract["reauthenticate"]>;
                        };
                        readonly hashingService: {
                            readonly verify: jest.Mock<CommonServices.Hashing.PublicContract["verify"]>;
                        };
                        readonly commands: globalThis.Commands.Reauthentication.Contract;
                        readonly configService: ConfigService;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
