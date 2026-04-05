import { Inject, Injectable, Scope } from "@nestjs/common";
import { isEmail } from "class-validator";

import { AccountSubject, AccountStatus, IdentifierType, IdentityActionType, IdentityEntityType } from "~context/enums";
import { ACCOUNT_SERVICE, RECOVERY_CODE_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AccountCommands implements Commands.Account.Contract {
    private readonly dictionaryPath = "commands.account";
    private readonly resource = "Account";

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
        @Inject(SESSION_SERVICE)
        private readonly sessionService: Services.Session.Contract,
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

    public async signup(props: Commands.Account.Signup): Promise<MessageResult> {
        const hashedPassword = await this.hashingService.hash({ value: props.input.password });
        const type = isEmail(props.input.identifier) ? IdentifierType.EMAIL : IdentifierType.PHONE;

        const account = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: (transaction) => {
                return this.accountService.create({
                    transaction,
                    input: {
                        primaryIdentifier: { value: props.input.identifier, type },
                        profile: { displayName: props.input.name },
                        subject: AccountSubject.HUMAN,
                        status: AccountStatus.PENDING,
                        password: hashedPassword,
                    },
                });
            },
        });

        await this.sendOTP({
            value: props.input.identifier,
            account: account.id,
            type,
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async resend(props: Commands.Account.Resend): Promise<MessageResult> {
        const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
            where: { value: props.input.identifier },
        });

        if (identifierEntity.isVerified) {
            throw CommandException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
        }

        await this.sendOTP({
            account: identifierEntity.account.id,
            value: identifierEntity.value,
            type: identifierEntity.type,
        });

        return { message: `${this.dictionaryPath}.CODE_RESENT` };
    }

    public async confirm(props: Commands.Account.Confirm.Props): Promise<Commands.Account.Confirm.Result> {
        const cachedAccount = await this.otpCacheService.getVerification({ code: props.input.code });

        if (!cachedAccount) {
            throw CommandException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }

        await this.otpCacheService.deleteVerification({ code: props.input.code });

        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const session = await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CONFIRM_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    where: { id: cachedAccount },
                    transaction,
                });

                this.accountService.confirm({ input: { account: accountEntity } });

                this.recoveryCodeService.generate({
                    transaction,
                    input: { account: accountEntity, hashes: hashedCodes },
                });

                return this.sessionService.create({
                    transaction,
                    input: {
                        account: accountEntity,
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                    },
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.CONFIRMED`,
            ...session,
            codes,
        };
    }

    public async deactivate(props: Commands.Account.Deactivate): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: props.actor },
                    transaction,
                });

                const sessions = account.sessions.getItems();

                this.accountService.deactivate({ transaction, input: { account, sessions } });
            },
        });

        return { message: `${this.dictionaryPath}.DEACTIVATED` };
    }

    public async suspend(props: Commands.Account.Suspend): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SUSPEND_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["sessions"] },
                    where: { id: props.input.account },
                    transaction,
                });

                const sessions = account.sessions.getItems();

                this.accountService.suspend({ transaction, input: { account, sessions } });
            },
        });

        return { message: `${this.dictionaryPath}.SUSPENDED` };
    }

    public async unsuspend(props: Commands.Account.Unsuspend): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.UNSUSPEND_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    where: { id: props.input.account },
                    transaction,
                });

                this.accountService.unsuspend({ input: { account } });
            },
        });

        return { message: `${this.dictionaryPath}.UNSUSPENDED` };
    }

    private async sendOTP(props: Commands.Account.SendOTP): Promise<void> {
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
            await this.smsService.send({
                to: props.value,
                body: `Your verification code: ${otp}`,
            });
        }
    }
}
