import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { HASHING_SERVICE, CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { IdentifierType, IdentityActionType, IdentityEntityType } from "~context/enums";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { IDENTIFIER_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { HandlerException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierHandler implements Handlers.Identifier.Contract {
    private readonly dictionaryPath = "handlers.identifier";
    private readonly resource = "Identifier";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
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

    public async create(props: Handlers.Identifier.Create): Promise<MessageResult> {
        const existing = await this.identifierRepository.findUnique({
            where: {
                value: props.input.value,
                type: props.input.type,
            },
        });

        if (existing) {
            throw HandlerException.conflict(`${this.dictionaryPath}.IDENTIFIER_ALREADY_EXISTS`);
        } else {
            const identifier = await this.transactional.run({
                resource: this.resource,
                audit: {
                    actionType: IdentityActionType.CREATE_ACCOUNT,
                    entityType: IdentityEntityType.IDENTIFIER,
                    ...props,
                },
                execute: async (transaction) => {
                    const accountEntity = await this.accountRepository.findUniqueOrThrow({
                        where: { id: props.input.account },
                        transaction,
                    });

                    const identifier = this.identifierService.create({
                        transaction,
                        input: {
                            account: accountEntity,
                            identifier: {
                                value: props.input.value,
                                type: props.input.type,
                                isVerified: false,
                            },
                        },
                    });

                    return identifier;
                },
            });

            await this.sendOTP({
                identifier: identifier.id,
                value: props.input.value,
                type: props.input.type,
            });

            return { message: `${this.dictionaryPath}.VERIFICATION_CODE_SENT` };
        }
    }

    public async resend(props: Handlers.Identifier.Resend): Promise<MessageResult> {
        const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
            where: {
                account: props.input.account,
                id: props.input.identifier,
            },
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
    }

    public async confirm(props: Handlers.Identifier.Confirm): Promise<MessageResult> {
        const identifier = await this.otpCacheService.getIdentifier({ code: props.input.code });

        if (identifier) {
            await this.otpCacheService.deleteIdentifier({ code: props.input.code });

            await this.transactional.run({
                resource: this.resource,
                audit: {
                    actionType: IdentityActionType.CREATE_ACCOUNT,
                    entityType: IdentityEntityType.IDENTIFIER,
                    ...props,
                },
                execute: async (transaction) => {
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
                        });
                    }
                },
            });

            return { message: `${this.dictionaryPath}.IDENTIFIER_VERIFIED` };
        } else {
            throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }
    }

    public async purge(props: Handlers.Identifier.Purge): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_ACCOUNT,
                entityType: IdentityEntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    options: { populate: ["account.password"] },
                    where: {
                        account: props.input.account,
                        id: props.input.identifier,
                    },
                    transaction,
                });

                if (identifierEntity.isVerified) {
                    if (props.input.password) {
                        const isValid = await this.hashingService.verify({
                            storedHash: identifierEntity.account.password?.hash!,
                            value: props.input.password,
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
                });
            },
        });

        return { message: `${this.dictionaryPath}.IDENTIFIER_REMOVED` };
    }

    public async setPrimary(props: Handlers.Identifier.SetPrimary): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_ACCOUNT,
                entityType: IdentityEntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    options: { populate: ["account.password"] },
                    where: {
                        account: props.input.account,
                        id: props.input.identifier,
                    },
                    transaction,
                });

                const isValid = await this.hashingService.verify({
                    storedHash: identifierEntity.account.password?.hash!,
                    value: props.input.password,
                });

                if (isValid) {
                    this.identifierService.setPrimary({
                        input: { identifier: identifierEntity },
                        transaction,
                    });
                } else {
                    throw HandlerException.badRequest(`${this.dictionaryPath}.INVALID_PASSWORD`);
                }
            },
        });

        return { message: `${this.dictionaryPath}.PRIMARY_CHANGED` };
    }

    public async toggleNotifications(props: Handlers.Identifier.ToggleNotifications): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_ACCOUNT,
                entityType: IdentityEntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: {
                        account: props.input.account,
                        id: props.input.identifier,
                    },
                    transaction,
                });

                this.identifierService.toggleNotifications({
                    input: { identifier: identifierEntity },
                });
            },
        });

        return { message: `${this.dictionaryPath}.NOTIFICATIONS_TOGGLED` };
    }

    public async togglePasswordlessLogin(props: Handlers.Identifier.TogglePasswordlessLogin): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_ACCOUNT,
                entityType: IdentityEntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifierEntity = await this.identifierRepository.findUniqueOrThrow({
                    where: {
                        account: props.input.account,
                        id: props.input.identifier,
                    },
                    transaction,
                });

                this.identifierService.togglePasswordlessLogin({
                    input: { identifier: identifierEntity },
                });
            },
        });

        return { message: `${this.dictionaryPath}.PASSWORDLESS_LOGIN_TOGGLED` };
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
