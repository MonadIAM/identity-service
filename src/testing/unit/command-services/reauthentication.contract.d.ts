import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Unit.Commands.Reauthentication {
        interface Contract extends Core.Contract {
            commands: Commands.Signature;
        }

        namespace Commands {
            type Result = Core.Execution.Result & {
                accountRepository: {
                    findUniqueOrThrow: Jest.Mock<Repositories.Account.PublicContract["findUniqueOrThrow"]>;
                };
                secondFactorService: Jest.Mocked<Pick<Services.SecondFactor.CommandContract, "reauthenticate">>;
                hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "verify">>;
                commands: globalThis.Commands.Reauthentication.Contract;
                configService: ConfigService;
            };

            type Signature = () => Result;
        }
    }
}
