import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { AccountSubject, IdentifierType } from "~context/enums";
import { ACCOUNT_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SignupHandler implements Handlers.Signup.Contract {
    private readonly dictionaryPath = "handlers.signup";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ACCOUNT_SERVICE)
        private readonly accountService: Services.Account.Contract,
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

    public async byEmail({
        input: { email, password, displayName },
        context,
    }: Handlers.Signup.ByEmail): Promise<MessageResult> {
        try {
            const hashedPassword = await this.hashingService.hash({ value: password });

            const writeManager = this.writeManager.fork();
            const account = await writeManager.transactional(async (transaction) => {
                return await this.accountService.create({
                    input: {
                        identifier: { type: IdentifierType.EMAIL, value: email },
                        subject: AccountSubject.HUMAN,
                        password: hashedPassword,
                        displayName,
                    },
                    context,
                    transaction,
                });
            });

            const otp = this.cryptoService.generateOTP();
            await this.otpCacheService.setVerification({ code: otp, account: account.id });
            await this.emailService.send({
                to: email,
                subject: "Verification code",
                html: `Your verification code: ${otp}`,
            });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async byPhone({
        input: { phone, password, displayName },
        context,
    }: Handlers.Signup.ByPhone): Promise<MessageResult> {
        try {
            const hashedPassword = await this.hashingService.hash({ value: password });

            const writeManager = this.writeManager.fork();
            const account = await writeManager.transactional(async (transaction) => {
                return await this.accountService.create({
                    input: {
                        identifier: { type: IdentifierType.PHONE, value: phone },
                        subject: AccountSubject.HUMAN,
                        password: hashedPassword,
                        displayName,
                    },
                    context,
                    transaction,
                });
            });

            const otp = this.cryptoService.generateOTP();
            await this.otpCacheService.setVerification({ code: otp, account: account.id });
            await this.smsService.send({ to: phone, body: `Your verification code: ${otp}` });

            return { message: `${this.dictionaryPath}.CREATED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
