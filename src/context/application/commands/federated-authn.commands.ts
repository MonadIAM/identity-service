import { Inject, Injectable, Scope } from "@nestjs/common";

import { HASHING_SERVICE, CRYPTO_SERVICE, GITHUB_OAUTH_SERVICE, GOOGLE_OAUTH_SERVICE } from "~common/services";
import { OAUTH_STATE_CACHE_SERVICE, AUTHORIZATION_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_REPOSITORY, INTERFACE_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { ACCOUNT_SERVICE, IDENTIFIER_SERVICE, RECOVERY_CODE_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";
import {
    AuthenticationContextClass,
    AccountTopicAction,
    AccountSubject,
    IdentifierType,
    AccountStatus,
    EntityType,
    ActionType,
    KafkaTopic,
} from "~context/enums";

import { AccountMapper } from "../mappers";
import { OAUTH_COMMANDS } from "./tokens";

@Injectable({ scope: Scope.DEFAULT })
export class FederatedAuthnCommands implements Commands.FederatedAuthn.Contract {
    private readonly mapper: Commands.Mappers.Account.Contract;
    private readonly dictionaryPath = "commands.federated-authn";
    private readonly oauthDictionaryPath = "commands.oauth";
    private readonly authnDictionaryPath = "commands.authn";
    private readonly resource = "Account";

    public constructor(
        @Inject(OAUTH_STATE_CACHE_SERVICE)
        private readonly oauthStateCacheService: InfrastructureServices.OAuthStateCache.PublicContract,
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.CommandContract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.CommandContract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.CommandContract,
        @Inject(GOOGLE_OAUTH_SERVICE)
        private readonly googleOAuthService: CommonServices.GoogleOAuth.PublicContract,
        @Inject(GITHUB_OAUTH_SERVICE)
        private readonly githubOAuthService: CommonServices.GitHubOAuth.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
        @Inject(AUTHORIZATION_CACHE_SERVICE)
        private readonly authorizationCacheService: InfrastructureServices.AuthorizationCache.PublicContract,
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.PublicContract,
        @Inject(OAUTH_COMMANDS)
        private readonly oauthCommands: Commands.OAuth.CommandsContract,
    ) {
        this.mapper = new AccountMapper();
    }

    public async authorize(props: Commands.FederatedAuthn.Authorize.Props): Commands.FederatedAuthn.Authorize.Result {
        const { input } = props;
        const oauthService = this.resolveProvider({ provider: input.provider });
        const request = await this.authorizationCacheService.get({ id: input.authorizationRequest });
        if (request) {
            const client = await this.interfaceClientRepository.findUniqueOrThrow({ where: { id: request.client } });
            const redirectUri = new URL("/auth/federated/callback", client.authAddress).toString();
            const state = this.cryptoService.generateToken();

            await this.oauthStateCacheService.set({
                state,
                metadata: {
                    authorizationRequest: input.authorizationRequest,
                    timeZone: input.timeZone ?? "UTC",
                    locale: input.locale ?? "en",
                    provider: input.provider,
                    redirectUri,
                },
            });

            return { url: oauthService.getAuthorizationUrl(state) };
        } else {
            throw Exception.badRequest({ messageKey: `${this.oauthDictionaryPath}.INVALID_AUTHORIZATION_REQUEST` });
        }
    }

    public async redirect(props: Commands.FederatedAuthn.Redirect.Props): Commands.FederatedAuthn.Redirect.Result {
        const cached = await this.oauthStateCacheService.get({ state: props.input.state });
        if (!cached?.redirectUri || cached.provider !== props.input.provider) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_STATE` });
        } else {
            const url = new URL(cached.redirectUri);
            url.searchParams.set("provider", props.input.provider);
            url.searchParams.set("state", props.input.state);

            if (props.input.code) {
                url.searchParams.set("code", props.input.code);
            }
            if (props.input.iss) {
                url.searchParams.set("iss", props.input.iss);
            }
            if (props.input.error) {
                url.searchParams.set("error", props.input.error);
            }
            return { url: url.toString() };
        }
    }

    public async callback(props: Commands.FederatedAuthn.Callback.Props): Commands.FederatedAuthn.Callback.Result {
        const { context, input } = props;
        const cached = await this.oauthStateCacheService.consume({ state: input.state });

        const expectedIssuer =
            input.provider === "github" ? "https://github.com/login/oauth" : "https://accounts.google.com";

        if (
            !cached?.authorizationRequest ||
            cached.provider !== input.provider ||
            (input.iss !== undefined && input.iss !== expectedIssuer)
        ) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_STATE` });
        } else {
            await this.oauthCommands.assertAuthorizationPending({ authorizationRequest: cached.authorizationRequest });
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
                    locale: cached.locale ?? "en",
                    timeZone: cached.timeZone ?? "UTC",
                },
            };

            const oauthIdentifier = await this.identifierRepository.findUnique({
                options: { populate: ["account"] },
                where: {
                    providerUserId: identity.providerUserId,
                    provider: identity.provider,
                },
            });

            let result: Commands.FederatedAuthn.AuthnResult;
            if (oauthIdentifier) {
                result = this.authenticateExisting({
                    input: { account: oauthIdentifier.account },
                    context,
                });
            } else {
                const emailIdentifier =
                    identity.email && identity.emailVerified
                        ? await this.identifierRepository.findUnique({
                              where: { type: IdentifierType.EMAIL, identity: identity.email },
                              options: { populate: ["account"] },
                          })
                        : null;

                if (emailIdentifier) {
                    result = await this.attachToExisting({
                        context,
                        input: { ...identity, account: emailIdentifier.account },
                    });
                } else {
                    result = await this.provision({ context, input: identity });
                }
            }
            const authorization = await this.oauthCommands.completeAuthorization({
                authorizationRequest: cached.authorizationRequest,
                account: result.account,
                acr: AuthenticationContextClass.FEDERATED,
            });
            return { message: result.message, ...authorization, recoveryCodes: result.recoveryCodes };
        }
    }

    public authenticateExisting(
        props: Commands.FederatedAuthn.AuthenticateExisting.Props,
    ): Commands.FederatedAuthn.AuthenticateExisting.Result {
        if (
            props.input.account.status !== AccountStatus.ACTIVE &&
            props.input.account.status !== AccountStatus.DEACTIVATED
        ) {
            throw Exception.forbidden({ messageKey: `${this.authnDictionaryPath}.ACCOUNT_SUSPENDED` });
        }
        return { message: `${this.dictionaryPath}.SIGNED_IN`, account: props.input.account.id };
    }

    public async attachToExisting(
        props: Commands.FederatedAuthn.AttachToExisting.Props,
    ): Commands.FederatedAuthn.AttachToExisting.Result {
        this.authenticateExisting({ context: props.context, input: { account: props.input.account } });
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.identifierService.create({
                    transaction,
                    input: {
                        account: props.input.account,
                        identifier: {
                            identity: `${props.input.provider}:${props.input.providerUserId}`,
                            providerUserId: props.input.providerUserId,
                            provider: props.input.provider,
                            type: IdentifierType.OAUTH,
                            isVerified: true,
                        },
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.LINKED_AND_SIGNED_IN`,
            account: props.input.account.id,
        };
    }

    public async provision(props: Commands.FederatedAuthn.Provision.Props): Commands.FederatedAuthn.Provision.Result {
        const codes = this.cryptoService.generateRecoveryCodes();
        const hashes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const { account } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.accountPayload,
                actionType: AccountTopicAction.VERIFY,
                destinationTopic: KafkaTopic.ACCOUNT,
            },
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.SIGN_UP,
                ...props,
            },
            changeLog: true,
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        primaryIdentifier: {
                            identity: `${props.input.provider}:${props.input.providerUserId}`,
                            providerUserId: props.input.providerUserId,
                            provider: props.input.provider,
                            type: IdentifierType.OAUTH,
                            isVerified: true,
                        },
                        additionalIdentifier:
                            props.input.email && props.input.emailVerified
                                ? {
                                      identity: props.input.email,
                                      type: IdentifierType.EMAIL,
                                      isVerified: true,
                                  }
                                : undefined,
                        profile: props.input.profile,
                        subject: AccountSubject.HUMAN,
                        status: AccountStatus.ACTIVE,
                    },
                });

                this.recoveryCodeService.generate({
                    input: { account, hashes },
                    transaction,
                });

                return { account };
            },
        });

        return {
            message: `${this.dictionaryPath}.SIGNED_UP`,
            account: account.id,
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
