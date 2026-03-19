import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";

import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { CREDENTIAL_SERVICE, RECOVERY_CODE_SERVICE } from "~context/domain/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { RecoveryCode } from "~context/domain/entities";
import { HandlerException } from "~common/exceptions";
import { IdentifierType } from "~context/enums";
import {
    PASSWORD_HISTORY_REPOSITORY,
    RECOVERY_CODE_REPOSITORY,
    IDENTIFIER_REPOSITORY,
    ACCOUNT_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordHandler implements Handlers.Password.Contract {
    private readonly dictionaryPath = "handlers.password";
    private readonly historyCheckDays: number;

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(PASSWORD_HISTORY_REPOSITORY)
        private readonly passwordHistoryRepository: Repositories.PasswordHistory.Contract,
        @Inject(RECOVERY_CODE_REPOSITORY)
        private readonly recoveryCodeRepository: Repositories.RecoveryCode.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
        @Inject(CREDENTIAL_SERVICE)
        private readonly credentialService: Services.Credential.Contract,
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

    public async change({ context, input }: Handlers.Password.Change): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["password"] },
                    where: { id: input.account },
                    transaction,
                });

                if (accountEntity.password) {
                    const isCurrentValid = await this.hashingService.verify({
                        storedHash: accountEntity.password.hash,
                        value: input.currentPassword,
                    });

                    if (isCurrentValid) {
                        await this.checkPasswordHistory(input.account, input.newPassword);

                        const newHash = await this.hashingService.hash({ value: input.newPassword });

                        this.credentialService.changePassword({
                            input: { password: accountEntity.password, newHash },
                            transaction,
                            context,
                        });

                        await transaction.flush();

                        return { message: `${this.dictionaryPath}.PASSWORD_CHANGED` };
                    } else {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_CURRENT_PASSWORD`);
                    }
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async regenerateRecoveryCodes({
        context,
        input,
    }: Handlers.Password.RegenerateRecoveryCodes.Props): Promise<Handlers.Password.RegenerateRecoveryCodes.Result> {
        try {
            const accountEntity = await this.accountRepository.findUniqueOrThrow({
                options: { populate: ["password", "recoveryCodes"] },
                where: { id: input.account },
            });

            if (accountEntity.password) {
                const isValid = await this.hashingService.verify({
                    storedHash: accountEntity.password.hash,
                    value: input.password,
                });

                if (isValid) {
                    const codes = this.cryptoService.generateRecoveryCodes();
                    const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

                    const writeManager = this.writeManager.fork();
                    await writeManager.transactional(async (transaction) => {
                        this.recoveryCodeService.regenerate({
                            input: { account: accountEntity, hashes: hashedCodes },
                            transaction,
                            context,
                        });

                        await transaction.flush();
                    });

                    return {
                        message: `${this.dictionaryPath}.RECOVERY_CODES_REGENERATED`,
                        recoveryCodes: codes,
                    };
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                }
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resetByRecoveryCode({ context, input }: Handlers.Password.ResetByRecoveryCode): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUnique({
                options: { populate: ["account.password"] },
                where: { value: input.identifier },
            });

            if (identifierEntity) {
                const recoveryCodes = await this.recoveryCodeRepository.find({
                    where: { account: identifierEntity.account.id, usedAt: null },
                });

                const matched = await this.findMatchingRecoveryCode(recoveryCodes, input.code);

                if (matched) {
                    if (matched.usedAt) {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.RECOVERY_CODE_ALREADY_USED`);
                    } else if (identifierEntity.account.password) {
                        const newHash = await this.hashingService.hash({ value: input.newPassword });

                        const writeManager = this.writeManager.fork();
                        await writeManager.transactional(async (transaction) => {
                            transaction.merge(matched);

                            matched.use();

                            this.credentialService.resetPassword({
                                input: { password: identifierEntity.account.password!, newHash },
                                transaction,
                                context,
                            });

                            await transaction.flush();
                        });

                        return { message: `${this.dictionaryPath}.PASSWORD_RESET` };
                    } else {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
                    }
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_RECOVERY_CODE`);
                }
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_RECOVERY_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async requestResetOTP({ input }: Handlers.Password.RequestResetOTP): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUnique({
                options: { populate: ["account"] },
                where: { value: input.identifier },
            });

            if (identifierEntity?.isVerified && identifierEntity.account) {
                const otp = this.cryptoService.generateOTP();
                await this.otpCacheService.setReset({ code: otp, account: identifierEntity.account.id });

                if (identifierEntity.type === IdentifierType.EMAIL) {
                    await this.emailService.send({
                        to: identifierEntity.value,
                        subject: "Password reset code",
                        html: `Your reset code: ${otp}`,
                    });
                } else if (identifierEntity.type === IdentifierType.PHONE) {
                    await this.smsService.send({ to: identifierEntity.value, body: `Your reset code: ${otp}` });
                }
            }

            return { message: `${this.dictionaryPath}.RESET_CODE_SENT` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resetByOTP({ context, input }: Handlers.Password.ResetByOTP): Promise<MessageResult> {
        try {
            const account = await this.otpCacheService.getReset({ code: input.code });

            if (account) {
                await this.otpCacheService.deleteReset({ code: input.code });

                const newHash = await this.hashingService.hash({ value: input.newPassword });

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        options: { populate: ["password"] },
                        where: { id: account },
                        transaction,
                    });

                    if (accountEntity.password) {
                        this.credentialService.resetPassword({
                            input: { password: accountEntity.password, newHash },
                            transaction,
                            context,
                        });

                        await transaction.flush();
                    } else {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
                    }
                });

                return { message: `${this.dictionaryPath}.PASSWORD_RESET` };
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private async checkPasswordHistory(account: string, newPassword: string): Promise<void> {
        const since = new Date();
        since.setDate(since.getDate() - this.historyCheckDays);

        const history = await this.passwordHistoryRepository.find({
            where: { account, setAt: { $gte: since } },
        });

        const results = await Promise.all(
            history.map(({ hash }) => this.hashingService.verify({ value: newPassword, storedHash: hash })),
        );

        if (results.some((isReused) => isReused)) {
            throw HandlerException.conflict(`${this.dictionaryPath}.PASSWORD_RECENTLY_USED`);
        }
    }

    private async findMatchingRecoveryCode(codes: RecoveryCode[], plaintext: string): Promise<Nullable<RecoveryCode>> {
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
