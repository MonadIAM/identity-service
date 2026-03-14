import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { GOOGLE_OAUTH_SERVICE, GITHUB_OAUTH_SERVICE, CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { OAUTH_STATE_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { ACCOUNT_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { AccountSubject, IdentifierType } from "~context/enums";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthHandler implements Handlers.OAuth.Contract {
    private readonly dictionaryPath = "handlers.oauth";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(OAUTH_STATE_CACHE_SERVICE)
        private readonly oauthStateCacheService: InfrastructureServices.OAuthStateCache.Contract,
        @Inject(GOOGLE_OAUTH_SERVICE)
        private readonly googleOAuthService: CommonServices.GoogleOAuth.Contract,
        @Inject(GITHUB_OAUTH_SERVICE)
        private readonly githubOAuthService: CommonServices.GitHubOAuth.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
    ) {}

    public async authorize({
        input: { provider },
    }: Handlers.OAuth.Authorize.Props): Promise<Handlers.OAuth.Authorize.Result> {
        const state = this.cryptoService.generateToken();
        await this.oauthStateCacheService.set({ state, metadata: { provider } });
        return { url: this.resolveProvider(provider).getAuthorizationUrl(state) };
    }

    public async callback({
        input: { provider, code, state },
        context,
    }: Handlers.OAuth.Callback.Props): Promise<Handlers.OAuth.Callback.Result> {
        try {
            const cached = await this.oauthStateCacheService.get({ state });

            if (cached?.provider === provider) {
                await this.oauthStateCacheService.delete({ state });

                const oauthService = this.resolveProvider(provider);
                const { access_token } = await oauthService.exchangeCode(code);
                const profile = await oauthService.fetchProfile(access_token);

                const existingByProvider = await this.identifierRepository.findUnique({
                    where: { provider, providerUserId: profile.providerUserId },
                });

                if (existingByProvider) {
                    return await this.login({ context, identifier: existingByProvider });
                }

                if (profile.email) {
                    const existingByEmail = await this.identifierRepository.findUnique({
                        where: { type: IdentifierType.EMAIL, value: profile.email },
                    });

                    if (existingByEmail) {
                        throw HandlerException.conflict(`${this.dictionaryPath}.EMAIL_ALREADY_EXISTS`);
                    }
                }

                return await this.signup({ provider, profile, context });
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private signup({ context, provider, profile }: Handlers.OAuth.Signup): Promise<Handlers.OAuth.Callback.Result> {
        const writeManager = this.writeManager.fork();

        return writeManager.transactional(async (transaction) => {
            const account = await this.accountService.createByOAuth({
                transaction,
                context,
                input: {
                    email: profile.email ? { type: IdentifierType.EMAIL, value: profile.email } : undefined,
                    subject: AccountSubject.HUMAN,
                    oauth: {
                        value: profile.email ?? profile.providerUserId,
                        providerUserId: profile.providerUserId,
                        type: IdentifierType.OAUTH,
                        provider,
                    },
                    profile: {
                        displayName: profile.displayName,
                        pictureUrl: profile.pictureUrl,
                    },
                },
            });

            const refreshToken = this.cryptoService.generateToken();
            const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

            const session = await this.sessionService.create({
                input: {
                    expiresAt: this.sessionService.resolveSessionExpiry(),
                    hash: refreshTokenHash,
                    account,
                },
                context,
                transaction,
            });

            const accessToken = await this.jwtService.signAccessToken({
                sub: account.id,
            });

            return { accessToken, refreshToken, session: session.id };
        });
    }

    private login({ context, identifier }: Handlers.OAuth.Login): Promise<Handlers.OAuth.Callback.Result> {
        const writeManager = this.writeManager.fork();

        return writeManager.transactional(async (transaction) => {
            const refreshToken = this.cryptoService.generateToken();
            const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

            const session = await this.sessionService.create({
                input: {
                    expiresAt: this.sessionService.resolveSessionExpiry(),
                    account: identifier.account,
                    hash: refreshTokenHash,
                },
                context,
                transaction,
            });

            const accessToken = await this.jwtService.signAccessToken({
                sub: identifier.account.id,
            });

            return { accessToken, refreshToken, session: session.id };
        });
    }

    private resolveProvider(provider: string): Handlers.OAuth.ResolveProvider {
        switch (provider) {
            case "google":
                return this.googleOAuthService;
            case "github":
                return this.githubOAuthService;
            default:
                throw HandlerException.badRequest(`${this.dictionaryPath}.UNSUPPORTED_PROVIDER`);
        }
    }
}
