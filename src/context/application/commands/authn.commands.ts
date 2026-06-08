import { Inject, Injectable, Scope } from "@nestjs/common";
import { BlacklistTopicAction } from "@liam/contracts";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import { TOTP, Secret } from "otpauth";

import { IdentifierType, AccountStatus, TokenGrantType, EntityType, KafkaTopic, ActionType, Client } from "~context/enums";
import { IDENTIFIER_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE, PENDING_2FA_CACHE_SERVICE } from "~context/infrastructure/services";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { ACCOUNT_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { SESSION_COMMANDS } from "~context/application/commands/tokens";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AuthnCommands implements Commands.Authn.Contract {
    private readonly dictionaryPath = "commands.authn";
    private readonly client = Client.WEB_DEV;
    private readonly accessTokenTTL: number;
    private readonly resource = "Authn";

    public constructor(
        private readonly configService: ConfigService,
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(SESSION_COMMANDS)
        private readonly sessionCommands: Commands.Session.PrivateContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(PENDING_2FA_CACHE_SERVICE)
        private readonly pending2FACacheService: InfrastructureServices.Pending2FACache.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
    ) {
        this.accessTokenTTL = ms(this.configService.getOrThrow<StringValue>("JWT_ACCESS_TTL")) / 1e3;
    }

    public async token(props: Commands.Authn.Token.Props): Commands.Authn.Token.Result {
        if (props.input.client !== this.client) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CLIENT` });
        }

        let result: Awaited<Commands.Authn.Password.Result | Commands.Authn.Refresh.Result>;

        if (props.input.grantType === TokenGrantType.PASSWORD) {
            result = await this.password(props);
        } else if (props.input.grantType === TokenGrantType.REFRESH_TOKEN) {
            result = await this.refresh(props);
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.UNSUPPORTED_GRANT_TYPE` });
        }

        if ("accessToken" in result) {
            return {
                ...result,
                tokenType: "Bearer",
                expiresIn: this.accessTokenTTL,
            };
        } else {
            return result;
        }
    }

    public async password(props: Commands.Authn.Password.Props): Commands.Authn.Password.Result {
        if (!props.input.identifier || !props.input.password) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CREDENTIALS` });
        }

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
                account: identifier.account.id,
                token: pendingToken,
            });

            return { message: `${this.dictionaryPath}.SIGNED_IN`, pendingToken, requires2FA: true };
        } else {
            const session = await this.createSession({ account: identifier.account, context: props.context });
            return { message: `${this.dictionaryPath}.SIGNED_IN`, ...session };
        }
    }

    public refresh(props: Commands.Authn.Refresh.Props): Commands.Authn.Refresh.Result {
        return this.sessionCommands.refresh({
            context: props.context,
            input: {
                refreshToken: props.input.refreshToken,
                client: props.input.client,
            },
        });
    }

    public async requestOTP(props: Commands.Authn.RequestOTP.Props): Commands.Authn.RequestOTP.Result {
        const identifier = await this.identifierRepository.findUnique({
            where: { value: props.input.identifier },
        });

        if (!identifier?.isVerified) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.PASSWORDLESS_NOT_AVAILABLE` });
        }

        const otp = this.cryptoService.generateOTP();

        await this.otpCacheService.set({
            value: identifier.id,
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
        const cachedIdentifier = await this.otpCacheService.consume({
            key: props.input.code,
            purpose: "login",
        });

        if (!cachedIdentifier) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }

        const identifier = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account"] },
            where: { id: cachedIdentifier },
        });

        this.assertCanAuthenticate(identifier.account);

        const session = await this.createSession({ account: identifier.account, context: props.context });
        return { message: `${this.dictionaryPath}.VERIFIED`, ...session };
    }

    public async verifySecondFactor(
        props: Commands.Authn.VerifySecondFactor.Props,
    ): Commands.Authn.VerifySecondFactor.Result {
        if (!props.token) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.PENDING_2FA_TOKEN_MISSING` });
        }

        const cachedAccount = await this.pending2FACacheService.get({ token: props.token });

        if (!cachedAccount) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.EXPIRED_PENDING_2FA` });
        }

        const factor = await this.secondFactorRepository.findUnique({
            options: { populate: ["account"] },
            where: {
                confirmedAt: { $ne: null },
                account: cachedAccount,
                id: props.input.id,
            },
        });

        if (!factor) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.NO_ACTIVE_2FA` });
        }

        const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
        const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

        if (!isValid) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
        }

        await this.pending2FACacheService.delete({ token: props.token });

        const session = await this.createSession({ account: factor.account, context: props.context });
        return { message: `${this.dictionaryPath}.VERIFIED`, ...session };
    }

    public async createSession(props: Commands.Authn.CreateSession.Props): Commands.Authn.CreateSession.Result {
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
                if (props.account.status === AccountStatus.DEACTIVATED) {
                    this.accountService.restore({ input: { account: props.account } });
                }

                props.account.touch();

                return this.sessionService.create({
                    transaction,
                    input: {
                        account: props.account,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            refreshToken: session.refreshToken,
            accessToken: session.accessToken,
        };
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
