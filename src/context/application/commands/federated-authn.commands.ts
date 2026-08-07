import { Inject, Injectable, Scope } from "@nestjs/common";

import { HASHING_SERVICE, CRYPTO_SERVICE, GITHUB_OAUTH_SERVICE, GOOGLE_OAUTH_SERVICE } from "~common/services";
import { OAUTH_STATE_CACHE_SERVICE } from "~context/infrastructure/services";
import { DEFAULT_OAUTH_SCOPE, SYSTEM_REALM_ID } from "~context/constants";
import { IDENTIFIER_REPOSITORY } from "~context/domain/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";
import {
    AuthenticationContextClass,
    BlacklistTopicAction,
    AccountSubject,
    IdentifierType,
    AccountStatus,
    EntityType,
    KafkaTopic,
    ActionType,
    Client,
} from "~context/enums";

import { ACCOUNT_SERVICE, IDENTIFIER_SERVICE, RECOVERY_CODE_SERVICE, SESSION_SERVICE } from "../services";
import { FederatedAuthnMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class FederatedAuthnCommands implements Commands.FederatedAuthn.Contract {
    private readonly mapper = new FederatedAuthnMapper();
    private readonly dictionaryPath = "commands.federated-authn";
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.CommandContract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.CommandContract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.CommandContract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.CommandContract,
        @Inject(OAUTH_STATE_CACHE_SERVICE)
        private readonly oauthStateCacheService: InfrastructureServices.OAuthStateCache.PublicContract,
        @Inject(GOOGLE_OAUTH_SERVICE)
        private readonly googleOAuthService: CommonServices.GoogleOAuth.PublicContract,
        @Inject(GITHUB_OAUTH_SERVICE)
        private readonly githubOAuthService: CommonServices.GitHubOAuth.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
    ) {}

    public async authorize(props: Commands.FederatedAuthn.Authorize.Props): Commands.FederatedAuthn.Authorize.Result {
        const { input } = props;
        const oauthService = this.resolveProvider({ provider: input.provider });
        const state = this.cryptoService.generateToken();

        await this.oauthStateCacheService.set({ state, metadata: { provider: input.provider } });

        return { url: oauthService.getAuthorizationUrl(state) };
    }

    public async callback(props: Commands.FederatedAuthn.Callback.Props): Commands.FederatedAuthn.Callback.Result {
        const { context, input } = props;
        const cached = await this.oauthStateCacheService.consume({ state: input.state });

        if (cached?.provider !== input.provider) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_STATE` });
        }

        const oauthService = this.resolveProvider({ provider: input.provider });
        const { access_token } = await oauthService.exchangeCode(input.code);
        const profile = await oauthService.fetchProfile(access_token);

        const identity: Commands.FederatedAuthn.Identity = {
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
                providerUserId: identity.providerUserId,
                provider: identity.provider,
            },
        });

        if (oauthIdentifier) {
            return this.authenticateExisting({
                input: { account: oauthIdentifier.account },
                context,
            });
        }

        const emailIdentifier =
            identity.email && identity.emailVerified
                ? await this.identifierRepository.findUnique({
                      where: { type: IdentifierType.EMAIL, value: identity.email },
                      options: { populate: ["account"] },
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
        props: Commands.FederatedAuthn.AuthenticateExisting.Props,
    ): Commands.FederatedAuthn.AuthenticateExisting.Result {
        const session = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.blacklistPayload,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.SIGN_IN,
                ...props,
            },
            execute: (transaction) => {
                return this.sessionService.create({
                    transaction,
                    input: {
                        acr: AuthenticationContextClass.FEDERATED,
                        userAgent: props.context.userAgent,
                        account: props.input.account,
                        scope: DEFAULT_OAUTH_SCOPE,
                        realms: [SYSTEM_REALM_ID],
                        client: Client.WEB_DEV,
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

    public async attachToExisting(
        props: Commands.FederatedAuthn.AttachToExisting.Props,
    ): Commands.FederatedAuthn.AttachToExisting.Result {
        const session = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.blacklistPayload,
                destinationTopic: KafkaTopic.BLACKLIST,
                actionType: BlacklistTopicAction.ADD,
            },
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.CREATE,
                ...props,
            },
            execute: (transaction) => {
                this.identifierService.create({
                    transaction,
                    input: {
                        account: props.input.account,
                        identifier: {
                            value: `${props.input.provider}:${props.input.providerUserId}`,
                            providerUserId: props.input.providerUserId,
                            provider: props.input.provider,
                            type: IdentifierType.OAUTH,
                            isVerified: true,
                        },
                    },
                });

                return this.sessionService.create({
                    transaction,
                    input: {
                        acr: AuthenticationContextClass.FEDERATED,
                        userAgent: props.context.userAgent,
                        account: props.input.account,
                        scope: DEFAULT_OAUTH_SCOPE,
                        realms: [SYSTEM_REALM_ID],
                        client: Client.WEB_DEV,
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

    public async provision(props: Commands.FederatedAuthn.Provision.Props): Commands.FederatedAuthn.Provision.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const session = await this.transactionalService.run({
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
                            value: `${props.input.provider}:${props.input.providerUserId}`,
                            providerUserId: props.input.providerUserId,
                            provider: props.input.provider,
                            type: IdentifierType.OAUTH,
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
                        acr: AuthenticationContextClass.FEDERATED,
                        userAgent: props.context.userAgent,
                        realms: [SYSTEM_REALM_ID],
                        client: Client.WEB_DEV,
                        ip: props.context.ip,
                        scope: DEFAULT_OAUTH_SCOPE,
                        account,
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

    public resolveProvider(
        props: Commands.FederatedAuthn.ResolveProvider.Props,
    ): Commands.FederatedAuthn.ResolveProvider.Result {
        switch (props.provider) {
            case "google":
                return this.googleOAuthService;
            case "github":
                return this.githubOAuthService;
            default:
                throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.UNSUPPORTED_PROVIDER` });
        }
    }
}
