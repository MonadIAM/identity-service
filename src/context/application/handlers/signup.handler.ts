import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccountSubject, IdentifierType, IdentityActionType, IdentityEntityType } from "~context/enums";
import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { ACCOUNT_SERVICE, RECOVERY_CODE_SERVICE } from "~context/domain/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SignupHandler implements Handlers.Signup.Contract {
    private readonly dictionaryPath = "handlers.signup";
    private readonly resource = "Signup";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
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

    public async byEmail(props: Handlers.Signup.ByEmail): Promise<MessageResult> {
        const hashedPassword = await this.hashingService.hash({ value: props.input.password });

        const account = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        identifier: { type: IdentifierType.EMAIL, value: props.input.email },
                        displayName: props.input.displayName,
                        subject: AccountSubject.HUMAN,
                        password: hashedPassword,
                    },
                });

                return account;
            },
        });

        await this.sendOTP({
            type: IdentifierType.EMAIL,
            value: props.input.email,
            account: account.id,
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async byPhone(props: Handlers.Signup.ByPhone): Promise<MessageResult> {
        const hashedPassword = await this.hashingService.hash({ value: props.input.password });

        const account = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        identifier: { type: IdentifierType.PHONE, value: props.input.phone },
                        displayName: props.input.displayName,
                        subject: AccountSubject.HUMAN,
                        password: hashedPassword,
                    },
                });

                return account;
            },
        });

        await this.sendOTP({
            type: IdentifierType.PHONE,
            value: props.input.phone,
            account: account.id,
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async resend(props: Handlers.Signup.Resend): Promise<MessageResult> {
        const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
            where: { value: props.input.identifier },
        });

        if (identifierEntity.isVerified) {
            throw HandlerException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
        } else {
            await this.sendOTP({
                account: identifierEntity.account.id,
                value: identifierEntity.value,
                type: identifierEntity.type,
            });

            return { message: `${this.dictionaryPath}.CODE_RESENT` };
        }
    }

    public async confirm(props: Handlers.Signup.Confirm.Props): Promise<Handlers.Signup.Confirm.Result> {
        const cachedAccount = await this.otpCacheService.getVerification({ code: props.input.code });

        if (cachedAccount) {
            await this.otpCacheService.deleteVerification({ code: props.input.code });

            const codes = this.cryptoService.generateRecoveryCodes();
            const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

            await this.transactional.run({
                resource: this.resource,
                audit: {
                    actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                    entityType: IdentityEntityType.ACCOUNT,
                    ...props,
                },
                execute: async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: cachedAccount },
                        transaction,
                    });

                    this.accountService.verify({
                        input: { account: accountEntity },
                        transaction,
                    });

                    this.recoveryCodeService.generate({
                        input: { account: accountEntity, hashes: hashedCodes },
                        transaction,
                    });
                },
            });

            return {
                message: `${this.dictionaryPath}.ACCOUNT_VERIFIED`,
                recoveryCodes: codes,
            };
        } else {
            throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }
    }

    private async sendOTP(props: Handlers.Signup.SendOTP): Promise<void> {
        const otp = this.cryptoService.generateOTP();
        await this.otpCacheService.setVerification({
            account: props.account,
            code: otp,
        });

        if (props.type === IdentifierType.EMAIL) {
            await this.emailService.send({
                html: `Your verification code: ${otp}`,
                subject: "Verify your account",
                to: props.value,
            });
        } else {
            await this.smsService.send({ to: props.value, body: `Your verification code: ${otp}` });
        }
    }
}
