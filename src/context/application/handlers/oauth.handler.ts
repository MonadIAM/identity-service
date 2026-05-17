import { Inject, Injectable, Scope } from "@nestjs/common";

import { GOOGLE_OAUTH_SERVICE, GITHUB_OAUTH_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { OAUTH_STATE_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { OAUTH_COMMANDS } from "~context/application/commands";
import { HandlerException } from "~common/exceptions";
import { IdentifierType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthHandler implements Handlers.OAuth.Contract {
    private readonly dictionaryPath = "handlers.oauth";

    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(OAUTH_COMMANDS)
        private readonly oauthCommands: Commands.OAuth.Contract,
        @Inject(OAUTH_STATE_CACHE_SERVICE)
        private readonly oauthStateCacheService: InfrastructureServices.OAuthStateCache.Contract,
        @Inject(GOOGLE_OAUTH_SERVICE)
        private readonly googleOAuthService: CommonServices.GoogleOAuth.Contract,
        @Inject(GITHUB_OAUTH_SERVICE)
        private readonly githubOAuthService: CommonServices.GitHubOAuth.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async authorize(props: Handlers.OAuth.Authorize.Props): Handlers.OAuth.Authorize.Result {
        const { input } = props;
        const state = this.cryptoService.generateToken();
        await this.oauthStateCacheService.set({ state, metadata: { provider: input.provider } });
        return { url: this.resolveProvider({ provider: input.provider }).getAuthorizationUrl(state) };
    }

    public async callback(props: Handlers.OAuth.Callback.Props): Handlers.OAuth.Callback.Result {
        const cached = await this.oauthStateCacheService.get({ state: props.input.state });

        if (cached?.provider !== props.input.provider) {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
        }

        await this.oauthStateCacheService.delete({ state: props.input.state });

        const oauthService = this.resolveProvider({ provider: props.input.provider });
        const { access_token } = await oauthService.exchangeCode(props.input.code);
        const profile = await oauthService.fetchProfile(access_token);

        const existingByProvider = await this.identifierRepository.findUnique({
            options: { populate: ["account"] },
            where: {
                provider: props.input.provider,
                providerUserId: profile.providerUserId,
            },
        });

        if (existingByProvider) {
            return this.oauthCommands.signin({
                context: props.context,
                input: {
                    account: existingByProvider.account,
                },
            });
        }

        return this.oauthCommands.signup({
            context: props.context,
            input: {
                oauth: {
                    providerUserId: profile.providerUserId,
                    value: profile.email ?? profile.providerUserId,
                    provider: props.input.provider,
                    type: IdentifierType.OAUTH,
                },
                profile: {
                    displayName: profile.displayName,
                },
                email: profile.email,
            },
        });
    }

    public resolveProvider(props: Handlers.OAuth.ResolveProvider.Props): Handlers.OAuth.ResolveProvider.Result {
        switch (props.provider) {
            case "google":
                return this.googleOAuthService;
            case "github":
                return this.githubOAuthService;
            default:
                throw HandlerException.badRequest(`${this.dictionaryPath}.UNSUPPORTED_PROVIDER`);
        }
    }
}
