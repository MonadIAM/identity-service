import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_SERVICE, IDENTIFIER_SERVICE, RECOVERY_CODE_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { AccountSubject, AccountStatus, IdentifierType, IdentityActionType, EntityType } from "~context/enums";
import { HASHING_SERVICE, CRYPTO_SERVICE, GITHUB_OAUTH_SERVICE, GOOGLE_OAUTH_SERVICE } from "~common/services";
import { OAUTH_STATE_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthCommands implements Commands.OAuth.Contract {
    private readonly dictionaryPath = "commands.oauth";
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(OAUTH_STATE_CACHE_SERVICE)
        private readonly oauthStateCacheService: InfrastructureServices.OAuthStateCache.Contract,
        @Inject(GOOGLE_OAUTH_SERVICE)
        private readonly googleOAuthService: CommonServices.GoogleOAuth.Contract,
        @Inject(GITHUB_OAUTH_SERVICE)
        private readonly githubOAuthService: CommonServices.GitHubOAuth.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async authorize(props: Commands.OAuth.Authorize.Props): Commands.OAuth.Authorize.Result {
        const { input } = props;
        const state = this.cryptoService.generateToken();
        await this.oauthStateCacheService.set({ state, metadata: { provider: input.provider } });
        return { url: this.resolveProvider({ provider: input.provider }).getAuthorizationUrl(state) };
    }

    public async callback(props: Commands.OAuth.Callback.Props): Commands.OAuth.Callback.Result {
        const cached = await this.oauthStateCacheService.get({ state: props.input.state });

        if (cached?.provider !== props.input.provider) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
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
            return this.signin({
                context: props.context,
                input: {
                    account: existingByProvider.account,
                },
            });
        }

        return this.signup({
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

    public async signup(props: Commands.OAuth.Signup.Props): Commands.OAuth.Signup.Result {
        const identifier = props.input.email
            ? await this.identifierRepository.findUnique({
                  options: { populate: ["account"] },
                  where: { type: IdentifierType.EMAIL, value: props.input.email },
              })
            : null;

        if (identifier) {
            return this.linkToExisting({ ...props, identifier });
        } else {
            return this.createNew(props);
        }
    }

    public async signin(props: Commands.OAuth.Signin.Props): Commands.OAuth.Signin.Result {
        const session = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SIGN_IN_ACCOUNT,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                return this.sessionService.create({
                    transaction,
                    input: {
                        account: props.input.account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.SIGNED_IN`,
            ...session,
        };
    }

    public async createNew(props: Commands.OAuth.Create.Props): Commands.OAuth.Create.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const result = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SIGN_UP_ACCOUNT,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        primaryIdentifier: {
                            providerUserId: props.input.oauth.providerUserId,
                            provider: props.input.oauth.provider,
                            value: props.input.oauth.value,
                            type: props.input.oauth.type,
                            isVerified: true,
                        },
                        additionalIdentifier: props.input.email
                            ? { value: props.input.email, type: IdentifierType.EMAIL, isVerified: true }
                            : undefined,
                        profile: props.input.profile,
                        subject: AccountSubject.HUMAN,
                        status: AccountStatus.ACTIVE,
                    },
                });

                this.recoveryCodeService.generate({
                    transaction,
                    input: { account, hashes: hashedCodes },
                });

                return this.sessionService.create({
                    transaction,
                    input: {
                        account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.SIGNED_UP`,
            recoveryCodes: codes,
            ...result,
        };
    }

    public async linkToExisting(props: Commands.OAuth.Link.Props): Commands.OAuth.Link.Result {
        const session = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.LINK_OAUTH_IDENTIFIER,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                this.identifierService.create({
                    transaction,
                    input: {
                        identifier: {
                            providerUserId: props.input.oauth.providerUserId,
                            provider: props.input.oauth.provider,
                            value: props.input.oauth.value,
                            type: props.input.oauth.type,
                            isVerified: true,
                        },
                        account: props.identifier.account,
                    },
                });

                return this.sessionService.create({
                    transaction,
                    input: {
                        account: props.identifier.account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.LINKED_AND_SIGNED_IN`,
            ...session,
        };
    }

    public resolveProvider(props: Commands.OAuth.ResolveProvider.Props): Commands.OAuth.ResolveProvider.Result {
        switch (props.provider) {
            case "google":
                return this.googleOAuthService;
            case "github":
                return this.githubOAuthService;
            default:
                throw CommandException.badRequest(`${this.dictionaryPath}.UNSUPPORTED_PROVIDER`);
        }
    }
}
