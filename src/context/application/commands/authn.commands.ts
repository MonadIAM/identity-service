import { Inject, Injectable, Scope } from "@nestjs/common";

import { PENDING_2FA_CACHE_SERVICE, OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";
import {
    AuthenticationContextClass,
    NotificationTopicAction,
    AccountStatus,
    EntityType,
    ActionType,
    KafkaTopic,
} from "~context/enums";

import { OAUTH_COMMANDS } from "./tokens";
import { AuthnMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class AuthnCommands implements Commands.Authn.Contract {
    private readonly mapper: Commands.Mappers.Authn.Contract;
    private readonly dictionaryPath = "commands.authn";
    private readonly resource = "Authn";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.CommandContract,
        @Inject(OAUTH_COMMANDS)
        private readonly oauthCommands: Commands.OAuth.CommandsContract,
        @Inject(PENDING_2FA_CACHE_SERVICE)
        private readonly pending2FACacheService: InfrastructureServices.Pending2FACache.PublicContract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
    ) {
        this.mapper = new AuthnMapper();
    }

    public async password(props: Commands.Authn.Password.Props): Commands.Authn.Password.Result {
        await this.oauthCommands.assertAuthorizationPending({
            authorizationRequest: props.input.authorizationRequest,
        });

        const identifier = await this.identifierRepository.findUnique({
            options: { populate: ["account.secondFactors", "account.password"] },
            where: { identity: props.input.identifier },
        });

        if (identifier?.account?.password) {
            const isValid = await this.hashingService.verify({
                storedHash: identifier.account.password.hash,
                value: props.input.password,
            });

            if (isValid) {
                this.assertCanAuthenticate(identifier.account);

                const hasActive2FA = identifier.account.secondFactors.getItems().some(({ confirmedAt }) => confirmedAt);

                if (hasActive2FA) {
                    const pendingToken = this.cryptoService.generateToken();
                    await this.pending2FACacheService.set({
                        metadata: {
                            authorizationRequest: props.input.authorizationRequest,
                            account: identifier.account.id,
                        },
                        token: pendingToken,
                    });

                    return { message: `${this.dictionaryPath}.PASSWORD_VERIFIED`, pendingToken, requires2FA: true };
                }

                const result = await this.oauthCommands.completeAuthorization({
                    authorizationRequest: props.input.authorizationRequest,
                    account: identifier.account.id,
                    acr: AuthenticationContextClass.PASSWORD,
                });

                return { message: `${this.dictionaryPath}.AUTHORIZATION_CONFIRMED`, ...result };
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CREDENTIALS` });
            }
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CREDENTIALS` });
        }
    }

    public async requestOTP(props: Commands.Authn.RequestOTP.Props): Commands.Authn.RequestOTP.Result {
        await this.oauthCommands.assertAuthorizationPending({
            authorizationRequest: props.input.authorizationRequest,
        });

        const identifier = await this.identifierRepository.findUnique({
            where: { identity: props.input.identifier },
        });

        if (identifier?.isVerified) {
            const otp = this.cryptoService.generateOTP();

            await this.otpCacheService.set({
                value: JSON.stringify({
                    authorizationRequest: props.input.authorizationRequest,
                    identifier: identifier.id,
                }),
                purpose: "login",
                key: otp,
            });

            await this.transactionalService.emit({
                payload: this.mapper.notificationPayload({ account: identifier.account.id, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
                resource: this.resource,
                audit: {
                    actionType: ActionType.REGENERATE,
                    entityType: EntityType.SESSION,
                    ...props,
                },
            });

            return { message: `${this.dictionaryPath}.OTP_SENT` };
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.PASSWORDLESS_NOT_AVAILABLE` });
        }
    }

    public async verifyOTP(props: Commands.Authn.VerifyOTP.Props): Commands.Authn.VerifyOTP.Result {
        const raw = await this.otpCacheService.consume({
            key: props.input.code,
            purpose: "login",
        });

        if (raw) {
            const cached: { authorizationRequest: string; identifier: string } = JSON.parse(raw);
            if (cached.authorizationRequest === props.input.authorizationRequest) {
                const identifier = await this.identifierRepository.findUniqueOrThrow({
                    options: { populate: ["account"] },
                    where: { id: cached.identifier },
                });

                this.assertCanAuthenticate(identifier.account);

                const result = await this.oauthCommands.completeAuthorization({
                    authorizationRequest: props.input.authorizationRequest,
                    acr: AuthenticationContextClass.OTP,
                    account: identifier.account.id,
                });

                return { message: `${this.dictionaryPath}.AUTHORIZATION_CONFIRMED`, ...result };
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
            }
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }
    }

    public async verifySecondFactor(
        props: Commands.Authn.VerifySecondFactor.Props,
    ): Commands.Authn.VerifySecondFactor.Result {
        if (props.token) {
            const cached = await this.pending2FACacheService.get({ token: props.token });

            if (cached) {
                const factor = await this.transactionalService.run({
                    resource: this.resource,
                    execute: async (transaction) => {
                        return await this.secondFactorService.authenticate({
                            input: { account: cached.account, factor: props.input.id, code: props.input.code },
                            transaction,
                        });
                    },
                });

                await this.pending2FACacheService.delete({ token: props.token });

                const result = await this.oauthCommands.completeAuthorization({
                    authorizationRequest: cached.authorizationRequest,
                    acr: AuthenticationContextClass.MFA,
                    account: factor.account.id,
                });

                return { message: `${this.dictionaryPath}.AUTHORIZATION_CONFIRMED`, ...result };
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.EXPIRED_PENDING_2FA` });
            }
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.PENDING_2FA_TOKEN_MISSING` });
        }
    }

    public assertCanAuthenticate(
        props: Commands.Authn.AssertCanAuthenticate.Props,
    ): Commands.Authn.AssertCanAuthenticate.Result {
        if (props.status === AccountStatus.SUSPENDED) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ACCOUNT_SUSPENDED` });
        }

        if (props.status === AccountStatus.PENDING) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ACCOUNT_NOT_VERIFIED` });
        }
    }
}
