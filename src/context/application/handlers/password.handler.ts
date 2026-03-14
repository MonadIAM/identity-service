import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";

import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { CREDENTIAL_SERVICE } from "~context/domain/services";
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

    public async change({
        input: { account, currentPassword, newPassword },
        context,
    }: Handlers.Password.Change): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();

            return await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["password"] },
                    where: { id: account },
                    transaction,
                });

                if (accountEntity.password) {
                    const isCurrentValid = await this.hashingService.verify({
                        storedHash: accountEntity.password.hash,
                        value: currentPassword,
                    });

                    if (isCurrentValid) {
                        await this.checkPasswordHistory(account, newPassword);

                        const newHash = await this.hashingService.hash({ value: newPassword });

                        await this.credentialService.changePassword({
                            input: { password: accountEntity.password, newHash },
                            context,
                            transaction,
                        });

                        return { message: `${this.dictionaryPath}.PASSWORD_CHANGED` };
                    } else {
                        throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_CURRENT_PASSWORD`);
                    }
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async requestReset({ input: { value } }: Handlers.Password.RequestReset): Promise<MessageResult> {
        try {
            const identifier = await this.identifierRepository.findUnique({
                options: { populate: ["account"] },
                where: { value },
            });

            if (identifier?.isVerified && identifier.account) {
                const otp = this.cryptoService.generateOTP();
                await this.otpCacheService.setReset({ code: otp, account: identifier.account.id });

                if (identifier.type === IdentifierType.EMAIL) {
                    await this.emailService.send({
                        to: identifier.value,
                        subject: "Password reset code",
                        html: `Your reset code: ${otp}`,
                    });
                } else if (identifier.type === IdentifierType.PHONE) {
                    await this.smsService.send({ to: identifier.value, body: `Your reset code: ${otp}` });
                }
            }

            return { message: `${this.dictionaryPath}.RESET_CODE_SENT` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resetByToken({
        input: { newPassword, code },
        context,
    }: Handlers.Password.ResetByToken): Promise<MessageResult> {
        try {
            const account = await this.otpCacheService.getReset({ code });

            if (account) {
                await this.otpCacheService.deleteReset({ code });

                const newHash = await this.hashingService.hash({ value: newPassword });

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        options: { populate: ["password"] },
                        where: { id: account },
                        transaction,
                    });

                    if (accountEntity.password) {
                        await this.credentialService.resetPassword({
                            input: { password: accountEntity.password, newHash },
                            transaction,
                            context,
                        });
                    } else {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
                    }
                });

                return { message: `${this.dictionaryPath}.PASSWORD_RESET` };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resetByRecoveryCode({
        input: { identifier, code, newPassword },
        context,
    }: Handlers.Password.ResetByRecoveryCode): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUnique({
                options: { populate: ["account.password"] },
                where: { value: identifier },
            });

            if (!identifierEntity) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_RECOVERY_CODE`);
            }

            const recoveryCodes = await this.recoveryCodeRepository.find({
                where: { account: identifierEntity.account.id, usedAt: null },
            });

            const matched = await this.findMatchingRecoveryCode(recoveryCodes, code);

            if (!matched) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_RECOVERY_CODE`);
            }

            if (!identifierEntity.account.password) {
                throw HandlerException.badRequest(`${this.dictionaryPath}.NO_PASSWORD_SET`);
            }

            const newHash = await this.hashingService.hash({ value: newPassword });

            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                matched.use();

                await this.credentialService.resetPassword({
                    input: { password: identifierEntity.account.password!, newHash },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.PASSWORD_RESET` };
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
        try {
            return await Promise.any(
                codes.map(async (entry) => {
                    if (await this.hashingService.verify({ value: plaintext, storedHash: entry.hash })) {
                        return entry;
                    } else {
                        throw new Error();
                    }
                }),
            );
        } catch {
            return null;
        }
    }
}
