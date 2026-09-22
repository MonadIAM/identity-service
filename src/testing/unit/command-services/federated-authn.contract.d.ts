declare namespace Unit.Commands.FederatedAuthn {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Promise<
            Core.Execution.Result & {
                commands: globalThis.Commands.FederatedAuthn.Contract;
                oauthStateCacheService: Jest.Mocked<
                    Pick<InfrastructureServices.OAuthStateCache.PublicContract, "set" | "consume">
                >;
                identifierRepository: {
                    findUnique: Jest.Mock<Repositories.Identifier.PublicContract["findUnique"]>;
                };
                recoveryCodeService: Jest.Mocked<Pick<Services.RecoveryCode.CommandContract, "generate">>;
                identifierService: Jest.Mocked<Pick<Services.Identifier.CommandContract, "create">>;
                sessionService: Jest.Mocked<Pick<Services.Session.CommandContract, "create">>;
                accountService: Jest.Mocked<Pick<Services.Account.CommandContract, "create">>;
                googleOAuthService: Jest.Mocked<
                    Pick<CommonServices.GoogleOAuth.PublicContract, "exchangeCode" | "fetchProfile" | "getAuthorizationUrl">
                >;
                githubOAuthService: Jest.Mocked<
                    Pick<CommonServices.GitHubOAuth.PublicContract, "exchangeCode" | "fetchProfile" | "getAuthorizationUrl">
                >;
                hashingService: Jest.Mocked<Pick<CommonServices.Hashing.PublicContract, "hash">>;
                cryptoService: Jest.Mocked<
                    Pick<CommonServices.Crypto.PublicContract, "generateToken" | "generateRecoveryCodes">
                >;
            }
        >;

        type Signature = () => Result;
    }
}
