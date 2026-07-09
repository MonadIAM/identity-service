import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { IDENTIFIER_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { AuthenticationContextClass, IdentifierType, AccountStatus } from "~context/enums";
import { OAUTH_COMMANDS } from "~context/application/commands/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";
import {
    SECOND_FACTOR_SECRET_SERVICE,
    PENDING_2FA_CACHE_SERVICE,
    OTP_CACHE_SERVICE,
} from "~context/infrastructure/services";

@Injectable({ scope: Scope.DEFAULT })
export class AuthnCommands implements Commands.Authn.Contract {
    private readonly dictionaryPath = "commands.authn";
    private readonly resource = "Authn";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(OAUTH_COMMANDS)
        private readonly oauthCommands: Commands.OAuth.CommandsContract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.Contract,
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.Contract,
        @Inject(PENDING_2FA_CACHE_SERVICE)
        private readonly pending2FACacheService: InfrastructureServices.Pending2FACache.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
    ) {}

    public async password(props: Commands.Authn.Password.Props): Commands.Authn.Password.Result {
        await this.oauthCommands.assertAuthorizationPending({
            authorizationRequest: props.input.authorizationRequest,
        });

        const identifier = await this.identifierRepository.findUnique({
            options: { populate: ["account.secondFactors", "account.password"] },
            where: { value: props.input.identifier },
        });

        if (!identifier?.account?.password) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CREDENTIALS` });
        }

        const isValid = await this.hashingService.verify({
            storedHash: identifier.account.password.hash,
            value: props.input.password,
        });

        if (!isValid) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CREDENTIALS` });
        }

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
    }

    public async requestOTP(props: Commands.Authn.RequestOTP.Props): Commands.Authn.RequestOTP.Result {
        await this.oauthCommands.assertAuthorizationPending({
            authorizationRequest: props.input.authorizationRequest,
        });

        const identifier = await this.identifierRepository.findUnique({
            where: { value: props.input.identifier },
        });

        if (!identifier?.isVerified) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.PASSWORDLESS_NOT_AVAILABLE` });
        }

        const otp = this.cryptoService.generateOTP();

        await this.otpCacheService.set({
            value: JSON.stringify({
                authorizationRequest: props.input.authorizationRequest,
                identifier: identifier.id,
            }),
            purpose: "login",
            key: otp,
        });

        if (identifier.type === IdentifierType.EMAIL) {
            await this.emailService.send({
                to: identifier.value,
                subject: "Sign-in code",
                html: `Your sign-in code: ${otp}`,
            });
        } else {
            await this.smsService.send({
                to: identifier.value,
                body: `Your sign-in code: ${otp}`,
            });
        }

        return { message: `${this.dictionaryPath}.OTP_SENT` };
    }

    public async verifyOTP(props: Commands.Authn.VerifyOTP.Props): Commands.Authn.VerifyOTP.Result {
        const raw = await this.otpCacheService.consume({
            key: props.input.code,
            purpose: "login",
        });

        if (!raw) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }

        const cached: { authorizationRequest: string; identifier: string } = JSON.parse(raw);
        if (cached.authorizationRequest !== props.input.authorizationRequest) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }

        const identifier = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account"] },
            where: { id: cached.identifier },
        });

        this.assertCanAuthenticate(identifier.account);

        const result = await this.oauthCommands.completeAuthorization({
            authorizationRequest: props.input.authorizationRequest,
            account: identifier.account.id,
            acr: AuthenticationContextClass.OTP,
        });

        return { message: `${this.dictionaryPath}.AUTHORIZATION_CONFIRMED`, ...result };
    }

    public async verifySecondFactor(
        props: Commands.Authn.VerifySecondFactor.Props,
    ): Commands.Authn.VerifySecondFactor.Result {
        if (!props.token) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.PENDING_2FA_TOKEN_MISSING` });
        }

        const cached = await this.pending2FACacheService.get({ token: props.token });

        if (!cached) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.EXPIRED_PENDING_2FA` });
        }

        const factor = await this.transactionalService.run<Entities.SecondFactor>({
            resource: this.resource,
            execute: async (transaction) => {
                const factor = await this.secondFactorRepository.findUnique({
                    options: { populate: ["account"] },
                    where: {
                        confirmedAt: { $ne: null },
                        account: cached.account,
                        id: props.input.id,
                    },
                    transaction,
                });

                if (!factor) {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.NO_ACTIVE_2FA` });
                }

                const { ciphertext, plaintext } = await this.secondFactorSecretService.resolve({
                    secret: factor.secret,
                });
                const totp = new TOTP({ secret: Secret.fromBase32(plaintext) });
                const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

                if (!isValid) {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
                }

                if (ciphertext) {
                    this.secondFactorService.rewrap({ input: { factor, secret: ciphertext }, transaction });
                }

                return factor;
            },
        });

        await this.pending2FACacheService.delete({ token: props.token });

        const result = await this.oauthCommands.completeAuthorization({
            authorizationRequest: cached.authorizationRequest,
            account: factor.account.id,
            acr: AuthenticationContextClass.MFA,
        });

        return { message: `${this.dictionaryPath}.AUTHORIZATION_CONFIRMED`, ...result };
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
