import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { SECOND_FACTOR_REPOSITORY, IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType, SecondFactorType } from "~context/enums";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorHandler implements Handlers.SecondFactor.Contract {
    private readonly dictionaryPath = "handlers.secondFactor";
    private readonly resource = "SecondFactor";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
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

    public async setup(props: Handlers.SecondFactor.Setup.Props): Promise<Handlers.SecondFactor.Setup.Result> {
        const existing = await this.secondFactorRepository.findUnique({
            where: { account: props.input.account, type: SecondFactorType.TOTP },
        });

        if (existing) {
            throw HandlerException.conflict(`${this.dictionaryPath}.TOTP_ALREADY_EXISTS`);
        } else {
            const secret = new Secret({ size: 20 });

            await this.otpCacheService.setSetup2FA({
                account: props.input.account,
                secret: secret.base32,
            });

            const totp = new TOTP({
                label: props.input.account,
                issuer: "Lambdius",
                secret,
            });

            return { uri: totp.toString() };
        }
    }

    public async confirm(props: Handlers.SecondFactor.Confirm.Props): Promise<Handlers.SecondFactor.Confirm.Result> {
        const secret = await this.otpCacheService.getSetup2FA({ account: props.input.account });

        if (secret) {
            const totp = new TOTP({ secret: Secret.fromBase32(secret) });
            const isValid = totp.validate({ token: props.input.totpCode, window: 1 }) !== null;

            if (isValid) {
                await this.otpCacheService.deleteSetup2FA({ account: props.input.account });

                const masterCodePlaintext = this.cryptoService.generateRecoveryCode();
                const masterCodeHash = await this.hashingService.hash({ value: masterCodePlaintext });

                await this.transactional.run({
                    resource: this.resource,
                    audit: {
                        actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                        entityType: IdentityEntityType.ACCOUNT,
                        ...props,
                    },
                    execute: async (transaction) => {
                        const accountEntity = await this.accountRepository.findUniqueOrThrow({
                            where: { id: props.input.account },
                            transaction,
                        });

                        this.secondFactorService.confirm({
                            transaction,
                            input: {
                                type: SecondFactorType.TOTP,
                                account: accountEntity,
                                name: props.input.name,
                                masterCodeHash,
                                secret,
                            },
                        });
                    },
                });

                return {
                    message: `${this.dictionaryPath}.TOTP_CONFIRMED`,
                    masterCode: masterCodePlaintext,
                };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
            }
        } else {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_OR_EXPIRED_SETUP`);
        }
    }

    public async remove(props: Handlers.SecondFactor.Remove): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const factor = await this.secondFactorRepository.findUniqueOrThrow({
                    where: { account: props.input.account, type: SecondFactorType.TOTP },
                    options: { populate: ["account.masterCode"] },
                    transaction,
                });

                if (factor.account.is2FAEnforced) {
                    throw HandlerException.conflict(`${this.dictionaryPath}.DISABLE_ENFORCE_FIRST`);
                }

                if (props.input.totpCode) {
                    const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
                    const isValid = totp.validate({ token: props.input.totpCode, window: 1 });

                    if (isValid === null) {
                        throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
                    }
                } else if (props.input.masterCode) {
                    const isValid = await this.hashingService.verify({
                        storedHash: factor.account.masterCode!.hash,
                        value: props.input.masterCode,
                    });

                    if (!isValid) {
                        throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_MASTER_CODE`);
                    }
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.CONFIRMATION_REQUIRED`);
                }

                this.secondFactorService.remove({
                    input: { factor, reason: props.input.reason },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.TOTP_REMOVED` };
    }

    public async enableEnforce(props: Handlers.SecondFactor.EnableEnforce): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const accountEntity = await this.accountRepository.findUniqueOrThrow({
                    options: { populate: ["secondFactors"] },
                    where: { id: props.input.account },
                    transaction,
                });

                const hasConfirmed = accountEntity.secondFactors.getItems().some(({ confirmedAt }) => confirmedAt !== null);

                if (hasConfirmed) {
                    this.secondFactorService.enableEnforce({
                        input: { account: accountEntity },
                        transaction,
                    });
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.NO_CONFIRMED_FACTOR`);
                }
            },
        });

        return { message: `${this.dictionaryPath}.ENFORCE_ENABLED` };
    }

    public async disableEnforce(props: Handlers.SecondFactor.DisableEnforce): Promise<MessageResult> {
        const secondFactor = await this.secondFactorRepository.findUniqueOrThrow({
            where: { account: { id: props.input.account }, type: SecondFactorType.TOTP },
        });

        const totp = new TOTP({ secret: Secret.fromBase32(secondFactor.secret) });
        const isValid = totp.validate({ token: props.input.totpCode, window: 1 }) !== null;

        if (isValid) {
            await this.transactional.run({
                resource: this.resource,
                audit: {
                    actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                    entityType: IdentityEntityType.ACCOUNT,
                    ...props,
                },
                execute: async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: props.input.account },
                        transaction,
                    });

                    this.secondFactorService.disableEnforce({
                        input: { account: accountEntity },
                        transaction,
                    });
                },
            });

            return { message: `${this.dictionaryPath}.ENFORCE_DISABLED` };
        } else {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
        }
    }

    public async resetByMasterCode(props: Handlers.SecondFactor.ResetByMasterCode): Promise<MessageResult> {
        const identifierEntity = await this.identifierRepository.findUnique({
            options: { populate: ["account.masterCode", "account.secondFactors"] },
            where: { value: props.input.identifier },
        });

        if (identifierEntity?.account?.masterCode) {
            const isValid = await this.hashingService.verify({
                storedHash: identifierEntity.account.masterCode!.hash,
                value: props.input.masterCode,
            });

            if (isValid) {
                await this.transactional.run({
                    resource: this.resource,
                    audit: {
                        actionType: IdentityActionType.DEACTIVATE_ACCOUNT,
                        entityType: IdentityEntityType.ACCOUNT,
                        ...props,
                    },
                    execute: (transaction) => {
                        transaction.merge(identifierEntity);

                        this.secondFactorService.resetByMasterCode({
                            input: { account: identifierEntity.account },
                            transaction,
                        });
                    },
                });

                return { message: `${this.dictionaryPath}.RESET_COMPLETE` };
            } else {
                throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_MASTER_CODE`);
            }
        } else {
            throw HandlerException.unauthorized(`${this.dictionaryPath}.INVALID_MASTER_CODE`);
        }
    }
}
