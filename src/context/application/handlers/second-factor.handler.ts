import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { TOTP, Secret } from "otpauth";

import { SECOND_FACTOR_REPOSITORY, IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import { SecondFactorType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorHandler implements Handlers.SecondFactor.Contract {
    private readonly dictionaryPath = "handlers.secondFactor";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async setup({
        input: { account },
    }: Handlers.SecondFactor.Setup.Props): Promise<Handlers.SecondFactor.Setup.Result> {
        try {
            const existing = await this.secondFactorRepository.findUnique({
                where: { account: account, type: SecondFactorType.TOTP },
            });

            if (existing) {
                throw HandlerException.conflict(`${this.dictionaryPath}.TOTP_ALREADY_EXISTS`);
            } else {
                const secret = new Secret({ size: 20 });

                await this.otpCacheService.setSetup2FA({
                    secret: secret.base32,
                    account,
                });

                const totp = new TOTP({
                    issuer: "Lambdius",
                    label: account,
                    secret,
                });

                return { uri: totp.toString() };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async confirm({
        input: { totpCode, account, name },
        context,
    }: Handlers.SecondFactor.Confirm.Props): Promise<Handlers.SecondFactor.Confirm.Result> {
        try {
            const secret = await this.otpCacheService.getSetup2FA({ account });

            if (secret) {
                const totp = new TOTP({ secret: Secret.fromBase32(secret) });
                const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;

                if (isValid) {
                    await this.otpCacheService.deleteSetup2FA({ account });

                    const masterCodePlaintext = this.cryptoService.generateRecoveryCode();
                    const masterCodeHash = await this.hashingService.hash({ value: masterCodePlaintext });

                    const writeManager = this.writeManager.fork();
                    await writeManager.transactional(async (transaction) => {
                        const accountEntity = await this.accountRepository.findUniqueOrThrow({
                            where: { id: account },
                            transaction,
                        });

                        await this.secondFactorService.confirm({
                            input: {
                                type: SecondFactorType.TOTP,
                                account: accountEntity,
                                masterCodeHash,
                                secret,
                                name,
                            },
                            transaction,
                            context,
                        });
                    });

                    return {
                        message: `${this.dictionaryPath}.TOTP_CONFIRMED`,
                        data: { masterCode: masterCodePlaintext },
                    };
                } else {
                    throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
                }
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_SETUP`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async remove({
        input: { masterCode, totpCode, account, reason },
        context,
    }: Handlers.SecondFactor.Remove): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const factor = await this.secondFactorRepository.findUniqueOrThrow({
                    where: { account, type: SecondFactorType.TOTP },
                    options: { populate: ["account.masterCode"] },
                    transaction,
                });

                if (factor.account.is2FAEnforced) {
                    throw HandlerException.conflict(`${this.dictionaryPath}.DISABLE_ENFORCE_FIRST`);
                }

                if (totpCode) {
                    const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
                    const isValid = totp.validate({ token: totpCode, window: 1 });

                    if (isValid === null) {
                        throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
                    }
                } else if (masterCode && factor.account.masterCode) {
                    const isValid = await this.hashingService.verify({
                        storedHash: factor.account.masterCode.hash,
                        value: masterCode,
                    });

                    if (!isValid) {
                        throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_MASTER_CODE`);
                    }
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.CONFIRMATION_REQUIRED`);
                }

                await this.secondFactorService.remove({
                    input: { factor, reason },
                    transaction,
                    context,
                });
            });

            return { message: `${this.dictionaryPath}.TOTP_REMOVED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async enableEnforce({
        input: { account },
        context,
    }: Handlers.SecondFactor.EnableEnforce): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            await writeManager.transactional(async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["secondFactors"] },
                    where: { id: account },
                    transaction,
                });

                const hasConfirmed = accountEntity.secondFactors.getItems().some(({ confirmedAt }) => confirmedAt !== null);

                if (hasConfirmed) {
                    await this.secondFactorService.enableEnforce({
                        input: { account: accountEntity },
                        transaction,
                        context,
                    });
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.NO_CONFIRMED_FACTOR`);
                }
            });

            return { message: `${this.dictionaryPath}.ENFORCE_ENABLED` };
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async disableEnforce({
        input: { account, totpCode },
        context,
    }: Handlers.SecondFactor.DisableEnforce): Promise<MessageResult> {
        try {
            const secondFactor = await this.secondFactorRepository.findUniqueOrThrow({
                where: { account, type: SecondFactorType.TOTP },
            });

            const totp = new TOTP({ secret: Secret.fromBase32(secondFactor.secret) });
            const isValid = totp.validate({ token: totpCode, window: 1 });

            if (isValid === null) {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
            } else {
                const writeManager = this.writeManager.fork();
                await writeManager.transactional(async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: account },
                        transaction,
                    });

                    await this.secondFactorService.disableEnforce({
                        input: { account: accountEntity },
                        transaction,
                        context,
                    });
                });

                return { message: `${this.dictionaryPath}.ENFORCE_DISABLED` };
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }

    public async resetByMasterCode({
        input: { identifier, masterCode },
        context,
    }: Handlers.SecondFactor.ResetByMasterCode): Promise<MessageResult> {
        try {
            const identifierEntity = await this.identifierRepository.findUnique({
                options: { populate: ["account.masterCode"] },
                where: { value: identifier },
            });

            if (identifierEntity?.account?.masterCode) {
                const isValid = await this.hashingService.verify({
                    storedHash: identifierEntity.account.masterCode.hash,
                    value: masterCode,
                });

                if (isValid) {
                    const writeManager = this.writeManager.fork();
                    await writeManager.transactional(async (transaction) => {
                        await this.secondFactorService.resetByMasterCode({
                            input: { account: identifierEntity.account },
                            transaction,
                            context,
                        });
                    });

                    return { message: `${this.dictionaryPath}.RESET_COMPLETE` };
                } else {
                    throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_MASTER_CODE`);
                }
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_MASTER_CODE`);
            }
        } catch (error) {
            throw HandlerException.fromOrmError(error);
        }
    }
}
