declare namespace Unit.Commands.RecoveryCode {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.RecoveryCode.Contract;
            recoveryCodeService: Jest.Mocked<Pick<Services.RecoveryCode.CommandContract, "regenerate">>;
            hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "hash">>;
            cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "generateRecoveryCodes">>;
        };

        type Signature = () => Result;
    }
}
