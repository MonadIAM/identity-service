import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentifierType, IdentityActionType, EntityType } from "~context/enums";
import { CRYPTO_SERVICE, EMAIL_SERVICE, SMS_SERVICE } from "~common/services";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { IDENTIFIER_SERVICE } from "~context/domain/services";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierCommands implements Commands.Identifier.Contract {
    private readonly dictionaryPath = "commands.identifier";
    private readonly resource = "Identifier";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.Contract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(EMAIL_SERVICE)
        private readonly emailService: CommonServices.Email.Contract,
        @Inject(SMS_SERVICE)
        private readonly smsService: CommonServices.SMS.Contract,
    ) {}

    public async create(props: Commands.Identifier.Create.Props): Commands.Identifier.Create.Result {
        const identifier = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.ADD_IDENTIFIER,
                entityType: EntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    where: { id: props.actor },
                    transaction,
                });

                return this.identifierService.create({
                    transaction,
                    input: {
                        account,
                        identifier: {
                            value: props.input.identifier,
                            type: props.input.type,
                        },
                    },
                });
            },
        });

        await this.sendOTP({
            identifier: identifier.id,
            value: props.input.identifier,
            type: props.input.type,
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async resend(props: Commands.Identifier.Resend.Props): Commands.Identifier.Resend.Pesult {
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: {
                value: props.input.identifier,
                account: props.actor,
            },
        });

        if (identifier.isVerified) {
            throw CommandException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
        }

        await this.sendOTP({
            identifier: identifier.id,
            value: identifier.value,
            type: identifier.type,
        });

        return { message: `${this.dictionaryPath}.CODE_RESENT` };
    }

    public async verify(props: Commands.Identifier.Verify.Props): Commands.Identifier.Verify.Result {
        const cachedIdentifier = await this.otpCacheService.consume({
            purpose: "identifier",
            key: props.input.code,
        });

        if (!cachedIdentifier) {
            throw CommandException.badRequest(`${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE`);
        }

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.VERIFY_IDENTIFIER,
                entityType: EntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: cachedIdentifier },
                    transaction,
                });

                if (identifier.isVerified) {
                    throw CommandException.conflict(`${this.dictionaryPath}.ALREADY_VERIFIED`);
                }

                this.identifierService.verify({ transaction, input: { identifier } });
            },
        });

        return { message: `${this.dictionaryPath}.VERIFIED` };
    }

    public async toggleNotifications(
        props: Commands.Identifier.ToggleNotifications.Props,
    ): Commands.Identifier.ToggleNotifications.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.TOGGLE_NOTIFICATIONS,
                entityType: EntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.identifierRepository.findUniqueOrThrow({
                    where: {
                        id: props.input.identifier,
                        account: props.actor,
                    },
                    transaction,
                });

                this.identifierService.toggleNotifications({ input: { identifier } });
            },
        });

        return { message: `${this.dictionaryPath}.NOTIFICATIONS_TOGGLED` };
    }

    public async togglePublicContact(
        props: Commands.Identifier.TogglePublicContact.Props,
    ): Commands.Identifier.TogglePublicContact.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.TOGGLE_PUBLIC_CONTACT,
                entityType: EntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.identifierRepository.findUniqueOrThrow({
                    where: {
                        id: props.input.identifier,
                        account: props.actor,
                    },
                    transaction,
                });

                this.identifierService.togglePublicContact({ input: { identifier } });
            },
        });

        return { message: `${this.dictionaryPath}.PUBLIC_CONTACT_TOGGLED` };
    }

    public async purge(props: Commands.Identifier.Purge.Props): Commands.Identifier.Purge.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.PURGE_IDENTIFIER,
                entityType: EntityType.IDENTIFIER,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.identifierRepository.findUniqueOrThrow({
                    options: { populate: ["account.password"] },
                    where: {
                        id: props.input.identifier,
                        account: props.actor,
                    },
                    transaction,
                });

                await this.identifierService.purge({
                    input: { identifier, account: props.actor },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async sendOTP(props: Commands.Identifier.SendOTP.Props): Commands.Identifier.SendOTP.Result {
        const { identifier, value, type } = props;
        const otp = this.cryptoService.generateOTP();

        await this.otpCacheService.set({
            purpose: "identifier",
            value: identifier,
            key: otp,
        });

        if (type === IdentifierType.EMAIL) {
            await this.emailService.send({
                to: value,
                subject: "Verify your identifier",
                html: `Your verification code: ${otp}`,
            });
        } else {
            await this.smsService.send({
                to: value,
                body: `Your verification code: ${otp}`,
            });
        }
    }
}
