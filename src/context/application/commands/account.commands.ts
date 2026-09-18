import { Inject, Injectable, Scope } from "@nestjs/common";
import { isEmail } from "class-validator";

import { ACCOUNT_SERVICE, RECOVERY_CODE_SERVICE } from "~context/domain/services";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";
import {
    NotificationTopicAction,
    AccountTopicAction,
    AccountSubject,
    IdentifierType,
    AccountStatus,
    ActionType,
    EntityType,
    KafkaTopic,
} from "~context/enums";

import { AccountMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class AccountCommands implements Commands.Account.Contract {
    private readonly mapper: Commands.Mappers.Account.Contract;
    private readonly dictionaryPath = "commands.account";
    private readonly resource = "Account";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.CommandContract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.CommandContract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
    ) {
        this.mapper = new AccountMapper();
    }

    public async signup(props: Commands.Account.Signup.Props): Commands.Account.Signup.Result {
        const hashedPassword = await this.hashingService.hash({ value: props.input.password });
        const type = isEmail(props.input.identifier) ? IdentifierType.EMAIL : IdentifierType.PHONE;

        const otp = this.cryptoService.generateOTP();

        const { account } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.notificationPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                actionType: ActionType.SIGN_UP,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            changeLog: true,
            execute: (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    input: {
                        primaryIdentifier: { identity: props.input.identifier, type },
                        profile: { displayName: props.input.name },
                        subject: AccountSubject.HUMAN,
                        status: AccountStatus.PENDING,
                        password: hashedPassword,
                    },
                });

                return { account: account.id, otp };
            },
        });

        await this.otpCacheService.set({
            purpose: "verification",
            value: account,
            key: otp,
        });

        return { message: `${this.dictionaryPath}.SIGNED_UP` };
    }

    public async resend(props: Commands.Account.Resend.Props): Commands.Account.Resend.Result {
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: { identity: props.input.identifier },
        });

        if (identifier.isVerified) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
        } else {
            const otp = this.cryptoService.generateOTP();

            await this.otpCacheService.set({
                value: identifier.account.id,
                purpose: "verification",
                key: otp,
            });

            await this.transactionalService.emit({
                payload: this.mapper.notificationPayload({ account: identifier.account.id, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
                resource: this.resource,
                audit: {
                    actionType: ActionType.REGENERATE,
                    entityType: EntityType.ACCOUNT,
                    ...props,
                },
            });

            return { message: `${this.dictionaryPath}.CODE_RESENT` };
        }
    }

    public async verify(props: Commands.Account.Verify.Props): Commands.Account.Verify.Result {
        const cachedAccount = await this.otpCacheService.consume({
            purpose: "verification",
            key: props.input.code,
        });

        if (cachedAccount) {
            const codes = this.cryptoService.generateRecoveryCodes();
            const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

            await this.transactionalService.run({
                resource: this.resource,
                outbox: {
                    payloadMapper: this.mapper.accountPayload,
                    actionType: AccountTopicAction.CREATE,
                    destinationTopic: KafkaTopic.ACCOUNT,
                },
                audit: {
                    entityType: EntityType.ACCOUNT,
                    actionType: ActionType.VERIFY,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    const account = await this.accountService.verify({
                        input: { account: cachedAccount },
                        transaction,
                    });

                    this.recoveryCodeService.generate({
                        transaction,
                        input: { account, hashes: hashedCodes },
                    });

                    return { account };
                },
            });

            return {
                message: `${this.dictionaryPath}.VERIFIED`,
                codes,
            };
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }
    }

    public async deactivate(props: Commands.Account.Deactivate.Props): Commands.Account.Deactivate.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: ActionType.DEACTIVATE,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.accountService.deactivate({ input: { account: props.actor }, transaction });
            },
        });

        return { message: `${this.dictionaryPath}.DEACTIVATED` };
    }

    public async suspend(props: Commands.Account.Suspend.Props): Commands.Account.Suspend.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.accountService.suspend({ input: { account: props.input.account }, transaction });
            },
        });

        return { message: `${this.dictionaryPath}.SUSPENDED` };
    }

    public async restore(props: Commands.Account.Restore.Props): Commands.Account.Restore.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.ACCOUNT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.accountService.unsuspend({ input: { account: props.input.account }, transaction });
            },
        });

        return { message: `${this.dictionaryPath}.RESTORED` };
    }
}
