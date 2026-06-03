import { Inject, Injectable, Scope } from "@nestjs/common";
import { BlacklistTopicAction } from "@liam/contracts";

import { ACCOUNT_SERVICE, IDENTIFIER_SERVICE, RECOVERY_CODE_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { AccountSubject, IdentifierType, AccountStatus, EntityType, KafkaTopic, ActionType } from "~context/enums";
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

    public async authorize({ input }: Commands.OAuth.Authorize.Props): Commands.OAuth.Authorize.Result {
        const oauthService = this.resolveProvider({ provider: input.provider });
        const state = this.cryptoService.generateToken();

        await this.oauthStateCacheService.set({ state, metadata: { provider: input.provider } });

        return { url: oauthService.getAuthorizationUrl(state) };
    }

    public async callback({ context, input }: Commands.OAuth.Callback.Props): Commands.OAuth.Callback.Result {
        const cached = await this.oauthStateCacheService.consume({ state: input.state });

        if (cached?.provider !== input.provider) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_STATE`);
        }

        const oauthService = this.resolveProvider({ provider: input.provider });
        const { access_token } = await oauthService.exchangeCode(input.code);
        const profile = await oauthService.fetchProfile(access_token);

        const identity: Commands.OAuth.Identity = {
            providerUserId: profile.providerUserId,
            emailVerified: profile.emailVerified,
            provider: input.provider,
            email: profile.email,
            profile: {
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
            },
        };

        const oauthIdentifier = await this.identifierRepository.findUnique({
            options: { populate: ["account"] },
            where: {
                provider: identity.provider,
                providerUserId: identity.providerUserId,
            },
        });

        if (oauthIdentifier) {
            return this.authenticateExisting({
                context,
                input: { account: oauthIdentifier.account },
            });
        }

        const emailIdentifier =
            identity.email && identity.emailVerified
                ? await this.identifierRepository.findUnique({
                      options: { populate: ["account"] },
                      where: { type: IdentifierType.EMAIL, value: identity.email },
                  })
                : null;

        if (emailIdentifier) {
            return this.attachToExisting({
                context,
                input: { ...identity, account: emailIdentifier.account },
            });
        }

        return this.provision({ context, input: identity });
    }

    public async authenticateExisting(
        props: Commands.OAuth.AuthenticateExisting.Props,
    ): Commands.OAuth.AuthenticateExisting.Result {
        const session = await this.transactionalService.run<Awaited<Services.Session.Create.Result>>({
            resource: this.resource,
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.SIGN_IN,
                ...props,
            },
            outbox: {
                payloadMapper: ({ revokedSessions }) => revokedSessions,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            execute: (transaction) => {
                return this.sessionService.create({
                    transaction,
                    input: {
                        userAgent: props.context.userAgent,
                        account: props.input.account,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.SIGNED_IN`,
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
        };
    }

    public async attachToExisting(props: Commands.OAuth.AttachToExisting.Props): Commands.OAuth.AttachToExisting.Result {
        const session = await this.transactionalService.run<Awaited<Services.Session.Create.Result>>({
            resource: this.resource,
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.CREATE,
                ...props,
            },
            outbox: {
                payloadMapper: ({ revokedSessions }) => revokedSessions,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            execute: (transaction) => {
                this.identifierService.create({
                    transaction,
                    input: {
                        account: props.input.account,
                        identifier: {
                            type: IdentifierType.OAUTH,
                            value: `${props.input.provider}:${props.input.providerUserId}`,
                            provider: props.input.provider,
                            providerUserId: props.input.providerUserId,
                            isVerified: true,
                        },
                    },
                });

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
            message: `${this.dictionaryPath}.LINKED_AND_SIGNED_IN`,
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
        };
    }

    public async provision(props: Commands.OAuth.Provision.Props): Commands.OAuth.Provision.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const session = await this.transactionalService.run<Awaited<Services.Session.Create.Result>>({
            resource: this.resource,
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.SIGN_UP,
                ...props,
            },
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        primaryIdentifier: {
                            type: IdentifierType.OAUTH,
                            value: `${props.input.provider}:${props.input.providerUserId}`,
                            provider: props.input.provider,
                            providerUserId: props.input.providerUserId,
                            isVerified: true,
                        },
                        additionalIdentifier:
                            props.input.email && props.input.emailVerified
                                ? {
                                      type: IdentifierType.EMAIL,
                                      value: props.input.email,
                                      isVerified: true,
                                  }
                                : undefined,
                        profile: props.input.profile,
                        subject: AccountSubject.HUMAN,
                        status: AccountStatus.ACTIVE,
                    },
                });

                this.recoveryCodeService.generate({
                    transaction,
                    input: { account, hashes },
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
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
            recoveryCodes: codes,
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
