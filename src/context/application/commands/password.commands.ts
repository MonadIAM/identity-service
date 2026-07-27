import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PASSWORD_HISTORY_REPOSITORY, IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/domain/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { IdentifierType, ActionType, EntityType } from "~context/enums";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
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
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
        private readonly configService: ConfigService,
    ) {
        this.historyCheckDays = this.configService.getOrThrow<number>("PASSWORD_HISTORY_CHECK_DAYS");
    }

    public async change(props: Commands.Password.Change.Props): Commands.Password.Change.Result {
        return await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.UPDATE,
                ...props,
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

            if (identifier.type === IdentifierType.EMAIL) {
                await this.emailService.send({
                    to: identifier.value,
                    subject: "Password reset code",
                    html: `Your reset code: ${otp}`,
                });
            } else {
                await this.smsService.send({
                    to: identifier.value,
                    body: `Your reset code: ${otp}`,
                });
            }
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
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account.password", "account.recoveryCodes"] },
            where: { value: props.input.identifier },
        });

        const recoveryCodes = identifier.account.recoveryCodes.getItems().filter(({ usedAt }) => !usedAt);

        const matched = await this.findMatchingRecoveryCode({ plaintext: props.input.code, codes: recoveryCodes });

        if (!matched) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_RECOVERY_CODE` });
        }

        return this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.RESET,
                ...props,
            },
            execute: async (transaction) => {
                await this.checkPasswordHistory({ account: identifier.account.id, password: props.input.password });

                const newHash = await this.hashingService.hash({ value: props.input.password });

                if (!identifier.account.password) {
                    throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
                }

                transaction.merge(identifier.account);
                matched.use();

                this.passwordService.rotate({
                    input: { password: identifier.account.password, newHash },
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
}
