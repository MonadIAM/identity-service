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

    public async create({ input: { account, type, value }, context }: Handlers.Identifier.Create): Promise<MessageResult> {
        try {
            const existing = await this.identifierRepository.findUnique({
                where: { type, value },
            });

            if (existing) {
                throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_EXISTS`);
            } else {
                const writeManager = this.writeManager.fork();
                const identifier = await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: account },
                        transaction,
                    });

                    return this.identifierService.create({
                        input: {
                            account: accountEntity,
                            identifier: {
                                isVerified: false,
                                value,
                                type,
                            },
                        },
                        context,
                        transaction,
                    });
                });

                await this.sendOTP({ identifier: identifier.id, type, value });

                return { message: `${this.dictionaryPath}.VERIFICATION_CODE_SENT` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resend({ input: { identifier, account } }: Handlers.Identifier.Resend): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                where: { id: identifier, account },
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

    public async confirm({ input: { code }, context }: Handlers.Identifier.Confirm): Promise<MessageResult> {
        try {
            const identifier = await this.otpCacheService.getIdentifier({ code });

            if (identifier) {
                await this.otpCacheService.deleteIdentifier({ code });

                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                        where: { id: identifier },
                        transaction,
                    });

                    if (identifierEntity.isVerified) {
                        throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_VERIFIED`);
                    } else {
                        await this.identifierService.verify({
                            input: { identifier: identifierEntity },
                            transaction,
                            context,
                        });
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

    public async purge({
        input: { identifier, password, account },
        context,
    }: Handlers.Identifier.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    options: { populate: ["account.password"] },
                    where: { id: identifier, account },
                    transaction,
                });

                if (identifierEntity.isVerified) {
                    if (password) {
                        const isValid = await this.hashingService.verify({
                            storedHash: identifierEntity.account.password?.hash!,
                            value: password,
                        });

                        if (!isValid) {
                            throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                        }
                    } else {
                        throw HandlerException.badRequest(`${this.dictionaryPath}.PASSWORD_REQUIRED`);
                    }
                }

                await this.identifierService.purge({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.IDENTIFIER_REMOVED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async setPrimary({
        input: { identifier, password, account },
        context,
    }: Handlers.Identifier.SetPrimary): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    options: { populate: ["account.password"] },
                    where: { id: identifier, account },
                    transaction,
                });

                const isValid = await this.hashingService.verify({
                    storedHash: identifierEntity.account.password?.hash!,
                    value: password,
                });

                if (isValid) {
                    await this.identifierService.setPrimary({
                        input: { identifier: identifierEntity },
                        transaction,
                        context,
                    });
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                }
            });

            return { message: `${this.dictionaryPath}.PRIMARY_CHANGED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async toggleNotifications({
        input: { identifier, account },
        context,
    }: Handlers.Identifier.ToggleNotifications): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier, account },
                    transaction,
                });

                await this.identifierService.toggleNotifications({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.NOTIFICATIONS_TOGGLED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async togglePasswordlessLogin({
        input: { identifier, account },
        context,
    }: Handlers.Identifier.TogglePasswordlessLogin): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: identifier, account },
                    transaction,
                });

                await this.identifierService.togglePasswordlessLogin({
                    input: { identifier: identifierEntity },
                    transaction,
                    context,
                });
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
