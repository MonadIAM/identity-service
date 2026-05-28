import { Inject, Injectable, Scope } from "@nestjs/common";
import { isEmail } from "class-validator";

import { ACCOUNT_SERVICE, RECOVERY_CODE_SERVICE, SESSION_SERVICE } from "~context/domain/services";
import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CommandException } from "~common/exceptions";
import {
    IdentityActionType,
    AccountSubject,
    IdentifierType,
    AggregateType,
    AccountStatus,
    EntityType,
    KafkaTopic,
    EventType,
} from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class AccountCommands implements Commands.Account.Contract {
    private readonly dictionaryPath = "commands.account";
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
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

    public async signup(props: Commands.Account.Signup.Props): Commands.Account.Signup.Result {
        const hashedPassword = await this.hashingService.hash({ value: props.input.password });
        const type = isEmail(props.input.identifier) ? IdentifierType.EMAIL : IdentifierType.PHONE;

        const account = await this.transactionalService.run<Entities.Account>({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SIGN_UP_ACCOUNT,
                entityType: EntityType.ACCOUNT,
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

        return { message: `${this.dictionaryPath}.SIGNED_UP` };
    }

    public async resend(props: Commands.Account.Resend.Props): Commands.Account.Resend.Result {
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: { value: props.input.identifier },
        });

        if (identifier.isVerified) {
            throw CommandException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
        }

        await this.sendOTP({
            account: identifier.account.id,
            value: identifier.value,
            type: identifier.type,
        });

        return { message: `${this.dictionaryPath}.CODE_RESENT` };
    }

    public async verify(props: Commands.Account.Verify.Props): Commands.Account.Verify.Result {
        const cachedAccount = await this.otpCacheService.consume({
            purpose: "verification",
            key: props.input.code,
        });

        if (!cachedAccount) {
            throw CommandException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }

        const codes = this.cryptoService.generateRecoveryCodes();
        const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

        const { tokens } = await this.transactionalService.run<{
            tokens: Awaited<Services.Session.Create.Result>;
            account: Entities.Account;
        }>({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.VERIFY_ACCOUNT,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            outbox: {
                eventType: EventType.ACCOUNT_REGISTERED,
                aggregateType: AggregateType.ACCOUNT,
                destinationTopic: KafkaTopic.ACCOUNT,
                payloadMapper: (result) => ({ accountId: result.account.id }),
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    where: { id: cachedAccount },
                    transaction,
                });

                this.accountService.verify({ input: { account } });

                this.recoveryCodeService.generate({
                    transaction,
                    input: { account, hashes: hashedCodes },
                });

                const tokens = await this.sessionService.create({
                    transaction,
                    input: {
                        userAgent: props.context.userAgent,
                        ip: props.context.ip,
                        account,
                    },
                });

                return { account, tokens };
            },
        });

        return {
            message: `${this.dictionaryPath}.VERIFIED`,
            refreshToken: tokens.refreshToken,
            accessToken: tokens.accessToken,
            codes,
        };
    }

    public async deactivate(props: Commands.Account.Deactivate.Props): Commands.Account.Deactivate.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: EntityType.ACCOUNT,
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

    public async suspend(props: Commands.Account.Suspend.Props): Commands.Account.Suspend.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.SUSPEND_ACCOUNT,
                entityType: EntityType.ACCOUNT,
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

    public async restore(props: Commands.Account.Restore.Props): Commands.Account.Restore.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.RESTORE_ACCOUNT,
                entityType: EntityType.ACCOUNT,
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

        return { message: `${this.dictionaryPath}.RESTORED` };
    }

    public async sendOTP(props: Commands.Account.SendOTP.Props): Commands.Account.SendOTP.Result {
        const otp = this.cryptoService.generateOTP();
        await this.otpCacheService.set({
            purpose: "verification",
            value: props.account,
            key: otp,
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
