import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { RECOVERY_CODE_SERVICE, IDENTIFIER_SERVICE, ACCOUNT_SERVICE } from "~context/domain/services";
import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { CRYPTO_SERVICE, EMAIL_SERVICE, HASHING_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { HandlerException } from "~common/exceptions";
import { IdentifierType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class VerificationHandler implements Handlers.Verification.Contract {
    private readonly dictionaryPath = "handlers.verification";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
    ) {}

    public async verifyAccount({
        input: { account, code },
        context,
    }: Handlers.Verification.VerifyAccount.Props): Promise<Handlers.Verification.VerifyAccount.Result> {
        try {
            const cachedAccount = await this.otpCacheService.getVerification({ code });

            if (!cachedAccount || cachedAccount !== account) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            } else {
                await this.otpCacheService.deleteVerification({ code });

                const codes = this.cryptoService.generateRecoveryCodes();
                const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: account },
                        transaction,
                    });

                    await this.accountService.verify({
                        input: { entity: accountEntity },
                        transaction,
                        context,
                    });

                    await this.recoveryCodeService.generate({
                        input: { account: accountEntity, hashes: hashedCodes },
                        transaction,
                    });
                });

                return {
                    message: `${this.dictionaryPath}.ACCOUNT_VERIFIED`,
                    data: { recoveryCodes: codes },
                };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async verifyIdentifier({
        input: { account, code },
        context,
    }: Handlers.Verification.VerifyIdentifier): Promise<MessageResult> {
        try {
            const cachedIdentifier = await this.otpCacheService.getVerification({ code });

            if (cachedIdentifier) {
                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const identifier = await this.identifierRepository.findUniqueOrThrow({
                        where: { id: cachedIdentifier, account },
                        transaction,
                    });

                    await this.identifierService.verify({
                        input: { identifier },
                        transaction,
                        context,
                    });
                });

                await this.otpCacheService.deleteVerification({ code });

                return { message: `${this.dictionaryPath}.IDENTIFIER_VERIFIED` };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resendVerification({
        input: { account, identifier, scenario },
    }: Handlers.Verification.Resend): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                where: identifier ? { id: identifier, account } : { account, primaryOfAccount: account },
            });

            if (identifierEntity.isVerified) {
                throw HandlerException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
            } else {
                const otp = this.cryptoService.generateOTP();
                const target = scenario === "account" ? identifierEntity.account.id : identifierEntity.id;

                await this.otpCacheService.setVerification({ code: otp, account: target });
                await this.dispatchOTP({ type: identifierEntity.type, value: identifierEntity.value, otp, scenario });

                return { message: `${this.dictionaryPath}.CODE_RESENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private async dispatchOTP({ scenario, value, type, otp }: Handlers.Verification.DispatchOTP): Promise<void> {
        const subject = scenario === "account" ? "Verify your account" : "Verify your identifier";
        if (type === IdentifierType.EMAIL) {
            await this.emailService.send({ to: value, subject, html: `Your verification code: ${otp}` });
        } else if (type === IdentifierType.PHONE) {
            await this.smsService.send({ to: value, body: `Your verification code: ${otp}` });
        }
    }
}
