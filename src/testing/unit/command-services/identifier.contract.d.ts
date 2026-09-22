declare namespace Unit.Commands.Identifier {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Promise<
            Core.Execution.Result & {
                commands: globalThis.Commands.Identifier.Contract;
                identifierRepository: {
                    findUniqueOrThrow: Jest.Mock<Repositories.Identifier.PublicContract["findUniqueOrThrow"]>;
                };
                identifierService: Jest.Mocked<
                    Pick<Services.Identifier.CommandContract, "create" | "verify" | "togglePublicContact" | "purge">
                >;
                otpCacheService: Jest.Mocked<Pick<InfrastructureServices.OTPCache.PublicContract, "set" | "consume">>;
                cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "generateOTP">>;
            }
        >;

        type Signature = () => Result;
    }
}
