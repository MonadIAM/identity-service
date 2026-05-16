import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { IdentifierType, IdentityActionType, EntityType } from "~context/enums";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { PASSWORD_SERVICE } from "~context/domain/services";
import { CommandException } from "~common/exceptions";
import {
    PASSWORD_HISTORY_REPOSITORY,
    IDENTIFIER_REPOSITORY,
    ACCOUNT_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordCommands implements Commands.Password.Contract {
    private readonly dictionaryPath = "commands.password";
    private readonly historyCheckDays: number;
    private readonly resource = "Password";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
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

    public async change(props: Commands.Password.Change.Props): Promise<Commands.Password.Change.Result> {
        return await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CHANGE_PASSWORD,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["password"] },
                    where: { id: props.actor },
                    transaction,
                });

                if (!account.password) {
                    throw CommandException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
                }

                const isValid = await this.hashingService.verify({
                    storedHash: account.password.hash,
                    value: props.input.currentPassword,
                });

                if (!isValid) {
                    throw CommandException.badRequest(`${this.dictionaryPath}.INVALID_CURRENT_PASSWORD`);
                }

                await this.checkPasswordHistory(props.actor, props.input.newPassword);

                const newHash = await this.hashingService.hash({ value: props.input.newPassword });

                this.passwordService.rotate({
                    input: { password: account.password, newHash },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.CHANGED` };
            },
        });
    }

    public async requestOTP(props: Commands.Password.RequestOTP.Props): Promise<Commands.Password.RequestOTP.Result> {
        const identifier = await this.identifierRepository.findUnique({
            options: { populate: ["account"] },
            where: { value: props.input.identifier },
        });

        if (identifier?.isVerified) {
            const otp = this.cryptoService.generateOTP();
            await this.otpCacheService.setReset({ code: otp, account: identifier.account.id });

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

    public async resetByOTP(props: Commands.Password.ResetByOTP.Props): Promise<Commands.Password.ResetByOTP.Result> {
        const cachedAccount = await this.otpCacheService.getReset({ code: props.input.code });

        if (!cachedAccount) {
            throw CommandException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }

        return this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.RESET_PASSWORD_BY_OTP,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                await this.otpCacheService.deleteReset({ code: props.input.code });

                await this.checkPasswordHistory(cachedAccount, props.input.password);

                const account = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["password"] },
                    where: { id: cachedAccount },
                    transaction,
                });

                if (!account.password) {
                    throw CommandException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
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
    ): Promise<Commands.Password.ResetByRecoveryCode.Result> {
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account.password", "account.recoveryCodes"] },
            where: { value: props.input.identifier },
        });

        const recoveryCodes = identifier.account.recoveryCodes.getItems().filter(({ usedAt }) => !usedAt);

        const matched = await this.findMatchingRecoveryCode(recoveryCodes, props.input.code);

        if (!matched) {
            throw CommandException.badRequest(`${this.dictionaryPath}.INVALID_RECOVERY_CODE`);
        }

        return this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.RESET_PASSWORD_BY_RECOVERY_CODE,
                entityType: EntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                await this.checkPasswordHistory(identifier.account.id, props.input.password);

                const newHash = await this.hashingService.hash({ value: props.input.password });

                if (!identifier.account.password) {
                    throw CommandException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
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

    private async checkPasswordHistory(account: string, password: string): Promise<void> {
        const since = new Date();
        since.setDate(since.getDate() - this.historyCheckDays);

        const history = await this.passwordHistoryRepository.find({
            where: { account, setAt: { $gte: since } },
        });

        const results = await Promise.all(
            history.map(({ hash }) => this.hashingService.verify({ value: password, storedHash: hash })),
        );

        if (results.some((isReused) => isReused)) {
            throw CommandException.conflict(`${this.dictionaryPath}.RECENTLY_USED`);
        }
    }

    private async findMatchingRecoveryCode(
        codes: Entities.RecoveryCode[],
        plaintext: string,
    ): Promise<Nullable<Entities.RecoveryCode>> {
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
