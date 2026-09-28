import { jest } from "@jest/globals";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class FederatedAuthnCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.FederatedAuthn.Contract
{
    public async commands(): Unit.Commands.FederatedAuthn.Commands.Result {
        const { FederatedAuthnCommands } = await import("~context/application/commands/federated-authn.commands.js");
        const execution = this.execution();

        const oauthStateCacheService = {
            set: jest.fn<InfrastructureServices.OAuthStateCache.PublicContract["set"]>(),
            consume: jest.fn<InfrastructureServices.OAuthStateCache.PublicContract["consume"]>(),
            get: jest.fn<InfrastructureServices.OAuthStateCache.PublicContract["get"]>(),
        };
        const identifierRepository = {
            findUnique: jest.fn<Repositories.Identifier.PublicContract["findUnique"]>(),
        };
        const recoveryCodeService = {
            generate: jest.fn<Services.RecoveryCode.CommandContract["generate"]>(),
        };
        const identifierService = {
            create: jest.fn<Services.Identifier.CommandContract["create"]>(),
        };
        const authorizationCacheService = {
            get: jest.fn<InfrastructureServices.AuthorizationCache.PublicContract["get"]>(),
        };
        const interfaceClientRepository = {
            findUniqueOrThrow: jest.fn<Repositories.InterfaceClient.PublicContract["findUniqueOrThrow"]>(),
        };
        interfaceClientRepository.findUniqueOrThrow.mockResolvedValue(
            this.contract<Awaited<ReturnType<Repositories.InterfaceClient.PublicContract["findUniqueOrThrow"]>>>({
                authAddress: "https://app.example/auth/login",
            }),
        );
        const oauthCommands = {
            assertAuthorizationPending: jest.fn<globalThis.Commands.OAuth.CommandsContract["assertAuthorizationPending"]>(),
            completeAuthorization: jest.fn<globalThis.Commands.OAuth.CommandsContract["completeAuthorization"]>(),
        };
        const accountService = {
            create: jest.fn<Services.Account.CommandContract["create"]>(),
        };
        const googleOAuthService = {
            getAuthorizationUrl: jest.fn<CommonServices.GoogleOAuth.PublicContract["getAuthorizationUrl"]>(),
            exchangeCode: jest.fn<CommonServices.GoogleOAuth.PublicContract["exchangeCode"]>(),
            fetchProfile: jest.fn<CommonServices.GoogleOAuth.PublicContract["fetchProfile"]>(),
        };
        const githubOAuthService = {
            getAuthorizationUrl: jest.fn<CommonServices.GitHubOAuth.PublicContract["getAuthorizationUrl"]>(),
            exchangeCode: jest.fn<CommonServices.GitHubOAuth.PublicContract["exchangeCode"]>(),
            fetchProfile: jest.fn<CommonServices.GitHubOAuth.PublicContract["fetchProfile"]>(),
        };
        const hashingService = {
            hash: jest.fn<CommonServices.Hashing.PublicContract["hash"]>(),
        };
        const cryptoService = {
            generateToken: jest.fn<CommonServices.Crypto.PublicContract["generateToken"]>(),
            generateRecoveryCodes: jest.fn<CommonServices.Crypto.PublicContract["generateRecoveryCodes"]>(),
        };

        return {
            ...execution,
            oauthStateCacheService,
            identifierRepository,
            recoveryCodeService,
            googleOAuthService,
            githubOAuthService,
            identifierService,
            authorizationCacheService,
            interfaceClientRepository,
            oauthCommands,
            accountService,
            hashingService,
            cryptoService,
            commands: new FederatedAuthnCommands(
                this.contract<InfrastructureServices.OAuthStateCache.PublicContract>(oauthStateCacheService),
                execution.transactional,
                this.contract<Repositories.Identifier.PublicContract>(identifierRepository),
                this.contract<Services.RecoveryCode.CommandContract>(recoveryCodeService),
                this.contract<Services.Identifier.CommandContract>(identifierService),
                this.contract<Services.Account.CommandContract>(accountService),
                this.contract<CommonServices.GoogleOAuth.PublicContract>(googleOAuthService),
                this.contract<CommonServices.GitHubOAuth.PublicContract>(githubOAuthService),
                this.contract<CommonServices.Hashing.PublicContract>(hashingService),
                this.contract<CommonServices.Crypto.PublicContract>(cryptoService),
                this.contract<InfrastructureServices.AuthorizationCache.PublicContract>(authorizationCacheService),
                this.contract<Repositories.InterfaceClient.PublicContract>(interfaceClientRepository),
                this.contract<globalThis.Commands.OAuth.CommandsContract>(oauthCommands),
            ),
        };
    }
}
