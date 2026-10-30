declare namespace Unit.Commands.Password {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "hash">>;
            commands: globalThis.Commands.Password.Contract;
            identifierRepository: {
                findUnique: Jest.Mock<Repositories.Identifier.PublicContract["findUnique"]>;
            };
            passwordService: Jest.Mocked<
                Pick<Services.Password.CommandContract, "set" | "resetByOTP" | "change" | "resetByRecoveryCode">
            >;
            otpCacheService: Jest.Mocked<Pick<InfrastructureServices.OTPCache.PublicContract, "consume" | "set">>;
            cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "generateOTP">>;
        };

        type Signature = () => Result;
    }
}
