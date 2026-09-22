declare namespace Unit.Commands.Authn {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Promise<
            Core.Execution.Result & {
                commands: globalThis.Commands.Authn.Contract;
                identifierRepository: {
                    findUnique: Jest.Mock<Repositories.Identifier.PublicContract["findUnique"]>;
                    findUniqueOrThrow: Jest.Mock<Repositories.Identifier.PublicContract["findUniqueOrThrow"]>;
                };
                secondFactorService: Jest.Mocked<Pick<Services.SecondFactor.CommandContract, "authenticate">>;
                oauthCommands: {
                    assertAuthorizationPending: Jest.Mock<
                        globalThis.Commands.OAuth.CommandsContract["assertAuthorizationPending"]
                    >;
                    completeAuthorization: Jest.Mock<globalThis.Commands.OAuth.CommandsContract["completeAuthorization"]>;
                };
                pending2FACacheService: Jest.Mocked<
                    Pick<InfrastructureServices.Pending2FACache.PublicContract, "set" | "get" | "delete">
                >;
                cryptoService: Jest.Mocked<Pick<CommonServices.Crypto.PublicContract, "generateToken" | "generateOTP">>;
                otpCacheService: Jest.Mocked<Pick<InfrastructureServices.OTPCache.PublicContract, "set" | "consume">>;
                hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "verify">>;
            }
        >;

        type Signature = () => Result;
    }
}
