import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RecoveryCodeCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.RecoveryCode.Contract;
                        readonly recoveryCodeService: {
                            readonly regenerate: jest.Mock<Services.RecoveryCode.CommandContract["regenerate"]>;
                        };
                        readonly hashingService: {
                            readonly hash: jest.Mock<CommonServices.Hashing.PublicContract["hash"]>;
                        };
                        readonly cryptoService: {
                            readonly generateRecoveryCodes: jest.Mock<
                                CommonServices.Crypto.PublicContract["generateRecoveryCodes"]
                            >;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
