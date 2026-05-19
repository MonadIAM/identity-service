import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { IDENTIFIER_REPOSITORY, SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE, PENDING_AUTH_CACHE_SERVICE } from "~context/infrastructure/services";
import { AccountStatus, IdentifierType, IdentityActionType, EntityType } from "~context/enums";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { ACCOUNT_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AuthCommands implements Commands.Auth.Contract {
    private readonly dictionaryPath = "commands.auth";
    private readonly resource = "Auth";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
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
        @Inject(PENDING_AUTH_CACHE_SERVICE)
        private readonly pendingAuthCacheService: InfrastructureServices.PendingAuthCache.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
    ) {}

    public async signin(props: Commands.Auth.Signin.Props): Commands.Auth.Signin.Result {
        const identifier = await this.identifierRepository.findUnique({
            options: { populate: ["account.secondFactors", "account.password"] },
            where: { value: props.input.identifier },
        });

        if (!identifier?.account?.password) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_CREDENTIALS`);
        }

        const isValid = await this.hashingService.verify({
            storedHash: identifier.account.password.hash,
            value: props.input.password,
        });

        if (!isValid) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_CREDENTIALS`);
        }

        this.assertCanAuth(identifier.account);

        const hasActive2FA = identifier.account.secondFactors.getItems().some(({ confirmedAt }) => confirmedAt);

        if (hasActive2FA) {
            const pendingToken = this.cryptoService.generateToken();
            await this.pendingAuthCacheService.set({
                account: identifier.account.id,
                token: pendingToken,
            });

            return { message: `${this.dictionaryPath}.SIGNED_IN`, pendingToken, requires2FA: true };
        } else {
            const session = await this.createSession({ account: identifier.account, context: props.context });
            return { message: `${this.dictionaryPath}.SIGNED_IN`, ...session };
        }
    }

    public async requestOTP(props: Commands.Auth.RequestOTP.Props): Commands.Auth.RequestOTP.Result {
        const identifier = await this.identifierRepository.findUnique({
            where: { value: props.input.identifier },
        });

        if (!identifier?.isVerified) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.PASSWORDLESS_NOT_AVAILABLE`);
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

    public async verifyOTP(props: Commands.Auth.VerifyOTP.Props): Commands.Auth.VerifyOTP.Result {
        const cachedIdentifier = await this.otpCacheService.consume({
            key: props.input.code,
            purpose: "login",
        });

        if (!cachedIdentifier) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }

        const identifier = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account"] },
            where: { id: cachedIdentifier },
        });

        this.assertCanAuth(identifier.account);

        const session = await this.createSession({ account: identifier.account, context: props.context });
        return { message: `${this.dictionaryPath}.VERIFIED`, ...session };
    }

    public async verifySecondFactor(
        props: Commands.Auth.VerifySecondFactor.Props,
    ): Commands.Auth.VerifySecondFactor.Result {
        if (!props.token) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.PENDING_TOKEN_MISSING`);
        }

        const cachedAccount = await this.pendingAuthCacheService.get({ token: props.token });

        if (!cachedAccount) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.EXPIRED_PENDING_AUTH`);
        }

        const factor = await this.secondFactorRepository.findUnique({
            options: { populate: ["account"] },
            where: {
                confirmedAt: { $ne: null },
                account: cachedAccount,
            },
        });

        if (!factor) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.NO_ACTIVE_2FA`);
        }

        const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
        const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

        if (!isValid) {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
        }

        await this.pendingAuthCacheService.delete({ token: props.token });

        const session = await this.createSession({ account: factor.account, context: props.context });
        return { message: `${this.dictionaryPath}.VERIFIED`, ...session };
    }

    public async createSession(props: Commands.Auth.CreateSession.Props): Commands.Auth.CreateSession.Result {
        return await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SIGN_IN_ACCOUNT,
                entityType: EntityType.ACCOUNT,
                ...props,
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
    }

    public assertCanAuth(props: Commands.Auth.AssertCanAuth.Props): Commands.Auth.AssertCanAuth.Result {
        if (props.status === AccountStatus.SUSPENDED) {
            throw CommandException.forbidden(`${this.dictionaryPath}.ACCOUNT_SUSPENDED`);
        }

        if (props.status === AccountStatus.PENDING) {
            throw CommandException.forbidden(`${this.dictionaryPath}.ACCOUNT_NOT_VERIFIED`);
        }
    }
}
