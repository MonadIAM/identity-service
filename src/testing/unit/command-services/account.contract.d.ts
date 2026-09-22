declare namespace Unit.Commands.Account {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Promise<
            Core.Execution.Result & {
                commands: globalThis.Commands.Account.Contract;
                identifierRepository: {
                    findUniqueOrThrow: Jest.Mock<Repositories.Identifier.PublicContract["findUniqueOrThrow"]>;
                };
                recoveryCodeService: Jest.Mocked<Pick<Services.RecoveryCode.CommandContract, "generate">>;
                accountService: Jest.Mocked<
                    Pick<Services.Account.CommandContract, "create" | "verify" | "deactivate" | "suspend" | "unsuspend">
                >;
                otpCacheService: Jest.Mocked<Pick<InfrastructureServices.OTPCache.PublicContract, "set" | "consume">>;
                hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "hash">>;
                cryptoService: Jest.Mocked<
                    Pick<CommonServices.Crypto.PublicContract, "generateOTP" | "generateRecoveryCodes">
                >;
            }
        >;

        type Signature = () => Result;
    }
}
