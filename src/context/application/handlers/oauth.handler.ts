import { Inject, Injectable, Scope } from "@nestjs/common";

import { GOOGLE_OAUTH_SERVICE, GITHUB_OAUTH_SERVICE, CRYPTO_SERVICE, JWT_SERVICE } from "~common/services";
import { AccountSubject, IdentifierType, IdentityActionType, IdentityEntityType } from "~context/enums";
import { OAUTH_STATE_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { ACCOUNT_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";
import { Session } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthHandler implements Handlers.OAuth.Contract {
    private readonly dictionaryPath = "handlers.oauth";
    private readonly resource = "OAuth";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
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

    public async authorize({ input }: Handlers.OAuth.Authorize.Props): Promise<Handlers.OAuth.Authorize.Result> {
        const state = this.cryptoService.generateToken();
        await this.oauthStateCacheService.set({ state, metadata: { provider: input.provider } });
        return { url: this.resolveProvider(input.provider).getAuthorizationUrl(state) };
    }

    // public async createByOAuth({
    //     input: { account, provider, code, state },
    //     context,
    // }: Handlers.Identifier.CreateByOAuth): Promise<MessageResult> {
    //     try {
    //         const cached = await this.oauthStateCacheService.get({ state });

    //         if (cached?.provider !== provider) {
    //             throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
    //         }

    //         await this.oauthStateCacheService.delete({ state });

    //         const oauthService = this.resolveProvider(provider);
    //         const { access_token } = await oauthService.exchangeCode(code);
    //         const profile = await oauthService.fetchProfile(access_token);

    //         const existingByProvider = await this.identifierRepository.findUnique({
    //             where: { provider, providerUserId: profile.providerUserId },
    //         });

    //         if (existingByProvider) {
    //             throw HandlerException.conflict(`${this.dictionaryPath}.OAUTH_ALREADY_LINKED`);
    //         } else {
    //             const writeManager = this.writeManager.fork();
    //             await writeManager.transactional(async (transaction) => {
    //                 const accountEntity = await this.accountRepository.findUniqueOrThrow({
    //                     where: { id: account },
    //                     transaction,
    //                 });
    //                 await this.identifierService.add({
    //                     input: {
    //                         account: accountEntity,
    //                         identifier: {
    //                             value: profile.email ?? profile.providerUserId,
    //                             providerUserId: profile.providerUserId,
    //                             type: IdentifierType.OAUTH,
    //                             isVerified: true,
    //                             provider,
    //                         },
    //                     },
    //                     transaction,
    //                     context,
    //                 });
    //             });

    //             return { message: `${this.dictionaryPath}.OAUTH_LINKED` };
    //         }
    //     } catch (error) {
    //         throw HandlerException.fromOrmError(error);
    //     }
    // }

    public async callback(props: Handlers.OAuth.Callback.Props): Promise<Handlers.OAuth.Callback.Result> {
        const cached = await this.oauthStateCacheService.get({ state: props.input.state });

        if (cached?.provider === props.input.provider) {
            await this.oauthStateCacheService.delete({ state: props.input.state });

            const oauthService = this.resolveProvider(props.input.provider);
            const { access_token } = await oauthService.exchangeCode(props.input.code);
            const profile = await oauthService.fetchProfile(access_token);

            const existingByProvider = await this.identifierRepository.findUnique({
                where: { provider: props.input.provider, providerUserId: profile.providerUserId },
            });

            if (existingByProvider) {
                return await this.login({ context: props.context, identifier: existingByProvider });
            }

            if (profile.email) {
                const existingByEmail = await this.identifierRepository.findUnique({
                    where: { type: IdentifierType.EMAIL, value: profile.email },
                });

                if (existingByEmail) {
                    throw HandlerException.conflict(`${this.dictionaryPath}.EMAIL_ALREADY_EXISTS`);
                }
            }

            return await this.signup({
                provider: props.input.provider,
                context: props.context,
                profile,
            });
        } else {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
        }
    }

    private signup(props: Handlers.OAuth.Signup): Promise<Handlers.OAuth.Callback.Result> {
        return this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_SESSION,
                entityType: IdentityEntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const account = this.accountService.createByOAuth({
                    transaction,
                    input: {
                        email: props.profile.email ? { type: IdentifierType.EMAIL, value: props.profile.email } : undefined,
                        subject: AccountSubject.HUMAN,
                        oauth: {
                            value: props.profile.email ?? props.profile.providerUserId,
                            providerUserId: props.profile.providerUserId,
                            type: IdentifierType.OAUTH,
                            provider: props.provider,
                        },
                        profile: {
                            displayName: props.profile.displayName,
                            pictureUrl: props.profile.pictureUrl,
                        },
                    },
                });

                const session = new Session({
                    expiresAt: this.sessionService.resolveSessionExpiry(),
                    userAgent: props.context.userAgent,
                    ip: props.context.ip,
                    account,
                });

                const refreshToken = await this.jwtService.signRefreshToken({
                    sub: account.id,
                    jti: session.id,
                });
                const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

                session.refresh(refreshTokenHash);

                this.sessionService.create({
                    input: { session, account },
                    context: props.context,
                    transaction,
                });

                const accessToken = await this.jwtService.signAccessToken({
                    sub: account.id,
                    jti: session.id,
                });

                return { accessToken, refreshToken, session: session.id };
            },
        });
    }

    private login(props: Handlers.OAuth.Login): Promise<Handlers.OAuth.Callback.Result> {
        return this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_SESSION,
                entityType: IdentityEntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const session = new Session({
                    expiresAt: this.sessionService.resolveSessionExpiry(),
                    userAgent: props.context.userAgent,
                    account: props.identifier.account,
                    ip: props.context.ip,
                });

                const refreshToken = await this.jwtService.signRefreshToken({
                    sub: props.identifier.account.id,
                    jti: session.id,
                });
                const refreshTokenHash = this.cryptoService.hashToken(refreshToken);

                session.refresh(refreshTokenHash);

                this.sessionService.create({
                    context: props.context,
                    transaction,
                    input: {
                        account: props.identifier.account,
                        session,
                    },
                });

                const accessToken = await this.jwtService.signAccessToken({
                    sub: props.identifier.account.id,
                    jti: session.id,
                });

                return { accessToken, refreshToken, session: session.id };
            },
        });
    }

    private resolveProvider(provider: string): OAuth.ResolveProvider {
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
