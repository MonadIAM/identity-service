import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { NotificationTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { PASSWORD_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";
import {
    PASSWORD_HISTORY_REPOSITORY,
    IDENTIFIER_REPOSITORY,
    ACCOUNT_REPOSITORY,
} from "~context/infrastructure/repositories";

import { PasswordMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordCommands implements Commands.Password.Contract {
    private readonly mapper: Commands.Mappers.Password.Contract;
    private readonly dictionaryPath = "commands.password";
    private readonly historyCheckWindowMs: number;
    private readonly resource = "Password";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(PASSWORD_HISTORY_REPOSITORY)
        private readonly passwordHistoryRepository: Repositories.PasswordHistory.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(PASSWORD_SERVICE)
        private readonly passwordService: Services.Password.CommandContract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
        private readonly configService: ConfigService,
    ) {
        this.mapper = new PasswordMapper();
        this.historyCheckWindowMs = ms(this.configService.getOrThrow<StringValue>("PASSWORD_HISTORY_CHECK_DAYS"));
    }

    public async change(props: Commands.Password.Change.Props): Commands.Password.Change.Result {
        return await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.passwordChangedPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
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

                return { message: `${this.dictionaryPath}.CHANGED`, account: props.actor };
            },
        });
    }

    public async requestOTP(props: Commands.Password.RequestOTP.Props): Commands.Password.RequestOTP.Result {
        const identifier = await this.identifierRepository.findUnique({
            where: { identity: props.input.identifier },
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
                payload: this.mapper.notificationPayload({ account: identifier.account.id, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
                resource: this.resource,
                audit: {
                    entityType: EntityType.PASSWORD,
                    actionType: ActionType.REGENERATE,
                    ...props,
                },
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
            outbox: {
                payloadMapper: this.mapper.passwordChangedViaOtpPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.RESET,
                ...props,
            },
            changeLog: true,
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

                return { message: `${this.dictionaryPath}.RESET`, account: cachedAccount };
            },
        });
    }

    public async resetByRecoveryCode(
        props: Commands.Password.ResetByRecoveryCode.Props,
    ): Commands.Password.ResetByRecoveryCode.Result {
        const { account } = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account.password", "account.recoveryCodes"] },
            where: { identity: props.input.identifier },
        });

        const recoveryCodes = account.recoveryCodes.getItems().filter(({ usedAt }) => !usedAt);

        const matched = await this.findMatchingRecoveryCode({ plaintext: props.input.code, codes: recoveryCodes });

        if (!matched) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_RECOVERY_CODE` });
        }

        return this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.passwordChangedViaRecoveryCodePayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.RESET,
                ...props,
            },
            changeLog: true,
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

                return { message: `${this.dictionaryPath}.RESET`, account: account.id };
            },
        });
    }

    public async checkPasswordHistory(
        props: Commands.Password.CheckPasswordHistory.Props,
    ): Commands.Password.CheckPasswordHistory.Result {
        const { password, account } = props;
        const since = new Date(Date.now() - this.historyCheckWindowMs);

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
}
