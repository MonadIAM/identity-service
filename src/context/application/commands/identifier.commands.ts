import { Inject, Injectable, Scope } from "@nestjs/common";
import {
    NotificationTopicAction,
    NotificationContentKind,
    NotificationCategory,
    PlatformService,
    MessageTemplate,
} from "@monadiam/shared";

import { ACCOUNT_REPOSITORY, IDENTIFIER_REPOSITORY } from "~context/domain/repositories";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { IDENTIFIER_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierCommands implements Commands.Identifier.Contract {
    private readonly dictionaryPath = "commands.identifier";
    private readonly resource = "Identifier";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
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
    ) {}

    public async create(props: Commands.Identifier.Create.Props): Commands.Identifier.Create.Result {
        const otp = this.cryptoService.generateOTP();

        const identifier = await this.transactionalService.run<Entities.Identifier>({
            resource: this.resource,
            outbox: {
                payloadMapper: () => this.notificationPayloadMapper({ account: props.actor, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.CREATE,
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

        await this.otpCacheService.set({
            purpose: "identifier",
            value: identifier.id,
            key: otp,
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
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
        }

        const otp = this.cryptoService.generateOTP();

        await this.otpCacheService.set({
            purpose: "identifier",
            value: identifier.id,
            key: otp,
        });

        await this.transactionalService.emit({
            payload: this.notificationPayloadMapper({ account: props.actor, otp }),
            actionType: NotificationTopicAction.CREATE,
            destinationTopic: KafkaTopic.NOTIFICATION,
            resource: this.resource,
        });

        return { message: `${this.dictionaryPath}.CODE_RESENT` };
    }

    public async verify(props: Commands.Identifier.Verify.Props): Commands.Identifier.Verify.Result {
        const cachedIdentifier = await this.otpCacheService.consume({
            purpose: "identifier",
            key: props.input.code,
        });

        if (!cachedIdentifier) {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.VERIFY,
                ...props,
            },
            execute: async (transaction) => {
                const identifier = await this.identifierRepository.findUniqueOrThrow({
                    where: { id: cachedIdentifier },
                    transaction,
                });

                if (identifier.isVerified) {
                    throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
                }

                this.identifierService.verify({ transaction, input: { identifier } });
            },
        });

        return { message: `${this.dictionaryPath}.VERIFIED` };
    }

    public async togglePublicContact(
        props: Commands.Identifier.TogglePublicContact.Props,
    ): Commands.Identifier.TogglePublicContact.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.UPDATE,
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
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.PURGE,
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

    public notificationPayloadMapper(
        props: Commands.Identifier.NotificationPayloadMapper.Props,
    ): Commands.Identifier.NotificationPayloadMapper.Result {
        return {
            template: MessageTemplate.IDENTIFIER_VERIFICATION_OTP,
            sourceService: PlatformService.IDENTITY_SERVICE,
            category: NotificationCategory.SECURITY,
            kind: NotificationContentKind.TEMPLATE,
            params: { otp: props.otp },
            recipient: props.account,
            language: "en",
        };
    }
}
