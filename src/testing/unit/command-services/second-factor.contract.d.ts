declare namespace Unit.Commands.SecondFactor {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Promise<
            Core.Execution.Result & {
                commands: globalThis.Commands.SecondFactor.Contract;
                secondFactorSecretService: Jest.Mocked<
                    Pick<InfrastructureServices.SecondFactorSecret.PublicContract, "encrypt">
                >;
                secondFactorService: Jest.Mocked<
                    Pick<Services.SecondFactor.CommandContract, "create" | "verify" | "reset" | "purge">
                >;
                hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "hash">>;
                cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "generateRecoveryCode">>;
                totpService: Jest.Mocked<Pick<CommonServices.TOTP.PublicContract, "createSecret" | "createURI">>;
            }
        >;

        type Signature = () => Result;
    }
}
