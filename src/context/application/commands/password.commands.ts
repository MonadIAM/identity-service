import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    NotificationTopicAction,
    NotificationContentKind,
    NotificationCategory,
    PlatformService,
    MessageTemplate,
} from "@monadiam/shared";

import { PASSWORD_HISTORY_REPOSITORY, IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/domain/repositories";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { PASSWORD_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordCommands implements Commands.Password.Contract {
    private readonly dictionaryPath = "commands.password";
    private readonly historyCheckDays: number;
    private readonly resource = "Password";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(PASSWORD_HISTORY_REPOSITORY)
        private readonly passwordHistoryRepository: Repositories.PasswordHistory.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(PASSWORD_SERVICE)
        private readonly passwordService: Services.Password.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        private readonly configService: ConfigService,
    ) {
        this.historyCheckDays = this.configService.getOrThrow<number>("PASSWORD_HISTORY_CHECK_DAYS");
    }

    public async change(props: Commands.Password.Change.Props): Commands.Password.Change.Result {
        return await this.transactionalService.run<MessageResult>({
            resource: this.resource,
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.UPDATE,
                ...props,
            },
            outbox: {
                payloadMapper: this.passwordChangedPayloadMapper.bind(this, { account: props.actor }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["password"] },
                    where: { id: props.actor },
                    transaction,
                });

                if (!account.password) {
                    throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
                }

                const isValid = await this.hashingService.verify({
                    storedHash: account.password.hash,
                    value: props.input.currentPassword,
                });

                if (!isValid) {
                    throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_CURRENT_PASSWORD` });
                }

                await this.checkPasswordHistory({ account: props.actor, password: props.input.newPassword });

                const newHash = await this.hashingService.hash({ value: props.input.newPassword });

                this.passwordService.rotate({
                    input: { password: account.password, newHash },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.CHANGED` };
            },
        });
    }

    public async requestOTP(props: Commands.Password.RequestOTP.Props): Commands.Password.RequestOTP.Result {
        const identifier = await this.identifierRepository.findUnique({
            where: { value: props.input.identifier },
            options: { populate: ["account"] },
        });

        if (identifier?.isVerified) {
            const otp = this.cryptoService.generateOTP();

            await this.otpCacheService.set({
                purpose: "reset",
                key: otp,
                value: identifier.account.id,
            });

            await this.transactionalService.emit({
                payload: this.notificationPayloadMapper({ account: identifier.account.id, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
                resource: this.resource,
            });
        }

        return { message: `${this.dictionaryPath}.RESET_CODE_SENT` };
    }

    public async resetByOTP(props: Commands.Password.ResetByOTP.Props): Commands.Password.ResetByOTP.Result {
        const cachedAccount = await this.otpCacheService.consume({
            key: props.input.code,
            purpose: "reset",
        });

        if (!cachedAccount) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }

        return this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.RESET,
                ...props,
            },
            outbox: {
                payloadMapper: this.passwordChangedViaOtpPayloadMapper.bind(this, { account: cachedAccount }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            execute: async (transaction) => {
                await this.checkPasswordHistory({ account: cachedAccount, password: props.input.password });

                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["password"] },
                    where: { id: cachedAccount },
                    transaction,
                });

                if (!account.password) {
                    throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
                }

                const newHash = await this.hashingService.hash({ value: props.input.password });

                this.passwordService.rotate({
                    input: { password: account.password, newHash },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.RESET` };
            },
        });
    }

    public async resetByRecoveryCode(
        props: Commands.Password.ResetByRecoveryCode.Props,
    ): Commands.Password.ResetByRecoveryCode.Result {
        const { account } = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account.password", "account.recoveryCodes"] },
            where: { value: props.input.identifier },
        });

        const recoveryCodes = account.recoveryCodes.getItems().filter(({ usedAt }) => !usedAt);

        const matched = await this.findMatchingRecoveryCode({ plaintext: props.input.code, codes: recoveryCodes });

        if (!matched) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_RECOVERY_CODE` });
        }

        return this.transactionalService.run<MessageResult>({
            resource: this.resource,
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.RESET,
                ...props,
            },
            outbox: {
                payloadMapper: this.passwordChangedViaRecoveryCodePayloadMapper.bind(this, { account: account.id }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            execute: async (transaction) => {
                await this.checkPasswordHistory({ account: account.id, password: props.input.password });

                const newHash = await this.hashingService.hash({ value: props.input.password });

                if (!account.password) {
                    throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
                }

                transaction.merge(account);
                matched.use();

                this.passwordService.rotate({
                    input: { password: account.password, newHash },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.RESET` };
            },
        });
    }

    public async checkPasswordHistory(
        props: Commands.Password.CheckPasswordHistory.Props,
    ): Commands.Password.CheckPasswordHistory.Result {
        const { password, account } = props;
        const since = new Date();
        since.setDate(since.getDate() - this.historyCheckDays);

        const history = await this.passwordHistoryRepository.find({
            where: { account, setAt: { $gte: since } },
        });

        const results = await Promise.all(
            history.map(({ hash }) => this.hashingService.verify({ value: password, storedHash: hash })),
        );

        if (results.some((isReused) => isReused)) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.RECENTLY_USED` });
        }
    }

    public async findMatchingRecoveryCode(
        props: Commands.Password.FindMatchingRecoveryCode.Props,
    ): Commands.Password.FindMatchingRecoveryCode.Result {
        const { plaintext, codes } = props;
        const results = await Promise.all(
            codes.map(async (entry) => ({
                isValid: await this.hashingService.verify({
                    storedHash: entry.hash,
                    value: plaintext,
                }),
                entry,
            })),
        );

        return results.find(({ isValid }) => isValid)?.entry ?? null;
    }

    public passwordChangedPayloadMapper(
        props: Commands.Password.PasswordChangedPayloadMapper.Props,
    ): Commands.Password.PasswordChangedPayloadMapper.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.PASSWORD_CHANGED,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public passwordChangedViaOtpPayloadMapper(
        props: Commands.Password.PasswordChangedViaOtpPayloadMapper.Props,
    ): Commands.Password.PasswordChangedViaOtpPayloadMapper.Result {
        return {
            template: MessageTemplate.PASSWORD_CHANGED_VIA_OTP,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public passwordChangedViaRecoveryCodePayloadMapper(
        props: Commands.Password.PasswordChangedViaRecoveryCodePayloadMapper.Props,
    ): Commands.Password.PasswordChangedViaRecoveryCodePayloadMapper.Result {
        return {
            template: MessageTemplate.PASSWORD_CHANGED_VIA_RECOVERY_CODE,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            recipient: props.account,
            language: "en",
        };
    }

    public notificationPayloadMapper(
        props: Commands.Password.NotificationPayloadMapper.Props,
    ): Commands.Password.NotificationPayloadMapper.Result {
        return {
            sourceService: PlatformService.IDENTITY_SERVICE,
            template: MessageTemplate.RESET_PASSWORD_OTP,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            params: { otp: props.otp },
            recipient: props.account,
            language: "en",
        };
    }
}
