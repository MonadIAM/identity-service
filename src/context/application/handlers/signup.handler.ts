import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { ACCOUNT_SERVICE, RECOVERY_CODE_SERVICE } from "~context/domain/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { AccountSubject, IdentifierType } from "~context/enums";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SignupHandler implements Handlers.Signup.Contract {
    private readonly dictionaryPath = "handlers.signup";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
        @Inject(RECOVERY_CODE_SERVICE)
        private readonly recoveryCodeService: Services.RecoveryCode.Contract,
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

    public async byEmail({ context, input }: Handlers.Signup.ByEmail): Promise<MessageResult> {
        try {
            const hashedPassword = await this.hashingService.hash({ value: input.password });

            const writeManager = this.writeManager.fork();
            const account = await writeManager.transactional(async (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    context,
                    input: {
                        identifier: { type: IdentifierType.EMAIL, value: input.email },
                        displayName: input.displayName,
                        subject: AccountSubject.HUMAN,
                        password: hashedPassword,
                    },
                });

                await transaction.flush();

                return account;
            });

            await this.sendOTP({ type: IdentifierType.EMAIL, account: account.id, value: input.email });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async byPhone({ context, input }: Handlers.Signup.ByPhone): Promise<MessageResult> {
        try {
            const hashedPassword = await this.hashingService.hash({ value: input.password });

            const writeManager = this.writeManager.fork();
            const account = await writeManager.transactional(async (transaction) => {
                const account = this.accountService.create({
                    transaction,
                    context,
                    input: {
                        identifier: { type: IdentifierType.PHONE, value: input.phone },
                        displayName: input.displayName,
                        subject: AccountSubject.HUMAN,
                        password: hashedPassword,
                    },
                });

                await transaction.flush();

                return account;
            });

            await this.sendOTP({ type: IdentifierType.PHONE, account: account.id, value: input.phone });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resend({ input }: Handlers.Signup.Resend): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                where: { value: input.identifier },
            });

            if (identifierEntity.isVerified) {
                throw HandlerException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
            } else {
                await this.sendOTP({
                    account: identifierEntity.account.id,
                    value: identifierEntity.value,
                    type: identifierEntity.type,
                });

                return { message: `${this.dictionaryPath}.CODE_RESENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async confirm({ context, input }: Handlers.Signup.Confirm.Props): Promise<Handlers.Signup.Confirm.Result> {
        try {
            const cachedAccount = await this.otpCacheService.getVerification({ code: input.code });

            if (cachedAccount) {
                await this.otpCacheService.deleteVerification({ code: input.code });

                const codes = this.cryptoService.generateRecoveryCodes();
                const hashedCodes = await Promise.all(codes.map((code) => this.hashingService.hash({ value: code })));

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: cachedAccount },
                        transaction,
                    });

                    this.accountService.verify({
                        input: { account: accountEntity },
                        transaction,
                        context,
                    });

                    this.recoveryCodeService.generate({
                        input: { account: accountEntity, hashes: hashedCodes },
                        transaction,
                    });

                    await transaction.flush();
                });

                return {
                    message: `${this.dictionaryPath}.ACCOUNT_VERIFIED`,
                    recoveryCodes: codes,
                };
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private async sendOTP({ account, value, type }: Handlers.Signup.SendOTP): Promise<void> {
        const otp = this.cryptoService.generateOTP();
        await this.otpCacheService.setVerification({ code: otp, account });

        if (type === IdentifierType.EMAIL) {
            await this.emailService.send({
                html: `Your verification code: ${otp}`,
                subject: "Verify your account",
                to: value,
            });
        } else {
            await this.smsService.send({ to: value, body: `Your verification code: ${otp}` });
        }
    }
}
