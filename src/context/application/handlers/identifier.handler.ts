import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import { IdentifierType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierHandler implements Handlers.Identifier.Contract {
    private readonly dictionaryPath = "handlers.identifier";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.Contract,
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

    public async create({ context, input }: Handlers.Identifier.Create): Promise<MessageResult> {
        try {
            const existing = await this.identifierRepository.findUnique({
                where: { type: input.type, value: input.value },
            });

            if (existing) {
                throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_EXISTS`);
            } else {
                const writeManager = this.writeManager.fork();
                const identifier = await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: input.account },
                        transaction,
                    });

                    const identifier = this.identifierService.create({
                        transaction,
                        context,
                        input: {
                            account: accountEntity,
                            identifier: {
                                value: input.value,
                                isVerified: false,
                                type: input.type,
                            },
                        },
                    });

                    await transaction.flush();

                    return identifier;
                });

                await this.sendOTP({ identifier: identifier.id, value: input.value, type: input.type });

                return { message: `${this.dictionaryPath}.VERIFICATION_CODE_SENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resend({ input }: Handlers.Identifier.Resend): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                where: { id: input.identifier, account: input.account },
            });

            if (identifierEntity.isVerified) {
                throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_VERIFIED`);
            } else {
                await this.sendOTP({
                    identifier: identifierEntity.id,
                    value: identifierEntity.value,
                    type: identifierEntity.type,
                });

                return { message: `${this.dictionaryPath}.VERIFICATION_CODE_SENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async confirm({ context, input }: Handlers.Identifier.Confirm): Promise<MessageResult> {
        try {
            const identifier = await this.otpCacheService.getIdentifier({ code: input.code });

            if (identifier) {
                await this.otpCacheService.deleteIdentifier({ code: input.code });

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                        where: { id: identifier },
                        transaction,
                    });

                    if (identifierEntity.isVerified) {
                        throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_VERIFIED`);
                    } else {
                        this.identifierService.verify({
                            input: { identifier: identifierEntity },
                            transaction,
                            context,
                        });

                        await transaction.flush();
                    }
                });

                return { message: `${this.dictionaryPath}.IDENTIFIER_VERIFIED` };
            } else {
                throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async purge({ context, input }: Handlers.Identifier.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: input.identifier, account: input.account },
                    options: { populate: ["account.password"] },
                    transaction,
                });

                if (identifierEntity.isVerified) {
                    if (input.password) {
                        const isValid = await this.hashingService.verify({
                            storedHash: identifierEntity.account.password?.hash!,
                            value: input.password,
                        });

                        if (!isValid) {
                            throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                        }
                    } else {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.PASSWORD_REQUIRED`);
                    }
                }

                this.identifierService.purge({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });

                await transaction.flush();
            });

            return { message: `${this.dictionaryPath}.IDENTIFIER_REMOVED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async setPrimary({ context, input }: Handlers.Identifier.SetPrimary): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: input.identifier, account: input.account },
                    options: { populate: ["account.password"] },
                    transaction,
                });

                const isValid = await this.hashingService.verify({
                    storedHash: identifierEntity.account.password?.hash!,
                    value: input.password,
                });

                if (isValid) {
                    this.identifierService.setPrimary({
                        input: { identifier: identifierEntity },
                        transaction,
                        context,
                    });

                    await transaction.flush();
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                }
            });

            return { message: `${this.dictionaryPath}.PRIMARY_CHANGED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async toggleNotifications({ context, input }: Handlers.Identifier.ToggleNotifications): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: input.identifier, account: input.account },
                    transaction,
                });

                this.identifierService.toggleNotifications({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });

                await transaction.flush();
            });

            return { message: `${this.dictionaryPath}.NOTIFICATIONS_TOGGLED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async togglePasswordlessLogin({
        context,
        input,
    }: Handlers.Identifier.TogglePasswordlessLogin): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: input.identifier, account: input.account },
                    transaction,
                });

                this.identifierService.togglePasswordlessLogin({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });

                await transaction.flush();
            });

            return { message: `${this.dictionaryPath}.PASSWORDLESS_LOGIN_TOGGLED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    private async sendOTP({ identifier, value, type }: Handlers.Identifier.SendOTP): Promise<void> {
        const otp = this.cryptoService.generateOTP();
        await this.otpCacheService.setIdentifier({ code: otp, identifier });

        if (type === IdentifierType.EMAIL) {
            await this.emailService.send({
                to: value,
                subject: "Verify your identifier",
                html: `Your verification code: ${otp}`,
            });
        } else {
            await this.smsService.send({ to: value, body: `Your verification code: ${otp}` });
        }
    }
}
