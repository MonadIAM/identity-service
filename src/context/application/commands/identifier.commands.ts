import { Inject, Injectable, Scope } from "@nestjs/common";

import { NotificationTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { IDENTIFIER_SERVICE } from "~context/domain/services";
import { CRYPTO_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { IdentifierMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierCommands implements Commands.Identifier.Contract {
    private readonly mapper: Commands.Mappers.Identifier.Contract;
    private readonly dictionaryPath = "commands.identifier";
    private readonly resource = "Identifier";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(IDENTIFIER_SERVICE)
        private readonly identifierService: Services.Identifier.CommandContract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
    ) {
        this.mapper = new IdentifierMapper();
    }

    public async create(props: Commands.Identifier.Create.Props): Commands.Identifier.Create.Result {
        const otp = this.cryptoService.generateOTP();

        const { identifier } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.notificationPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const identifier = await this.identifierService.create({
                    transaction,
                    input: {
                        account: props.actor,
                        identifier: {
                            identity: props.input.identifier,
                            type: props.input.type,
                        },
                    },
                });

                return { identifier, account: props.actor, otp };
            },
        });

        await this.otpCacheService.set({
            purpose: "identifier",
            value: identifier.id,
            key: otp,
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async resend(props: Commands.Identifier.Resend.Props): Commands.Identifier.Resend.Result {
        const identifier = await this.identifierRepository.findUniqueOrThrow({
            where: {
                identity: props.input.identifier,
                account: props.actor,
            },
        });

        if (identifier.isVerified) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.ALREADY_VERIFIED` });
        } else {
            const otp = this.cryptoService.generateOTP();

            await this.otpCacheService.set({
                purpose: "identifier",
                value: identifier.id,
                key: otp,
            });

            await this.transactionalService.emit({
                payload: this.mapper.notificationPayload({ identifier, account: props.actor, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
                resource: this.resource,
                audit: {
                    entityType: EntityType.IDENTIFIER,
                    actionType: ActionType.REGENERATE,
                    ...props,
                },
            });

            return { message: `${this.dictionaryPath}.CODE_RESENT` };
        }
    }

    public async verify(props: Commands.Identifier.Verify.Props): Commands.Identifier.Verify.Result {
        const cachedIdentifier = await this.otpCacheService.consume({
            purpose: "identifier",
            key: props.input.code,
        });

        if (cachedIdentifier) {
            await this.transactionalService.run({
                resource: this.resource,
                audit: {
                    entityType: EntityType.IDENTIFIER,
                    actionType: ActionType.VERIFY,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    await this.identifierService.verify({ input: { identifier: cachedIdentifier }, transaction });
                },
            });

            return { message: `${this.dictionaryPath}.VERIFIED` };
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }
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
            changeLog: true,
            execute: async (transaction) => {
                await this.identifierService.togglePublicContact({
                    input: { identifier: props.input.identifier, account: props.actor },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.PUBLIC_CONTACT_TOGGLED` };
    }

    public async purge(props: Commands.Identifier.Purge.Props): Commands.Identifier.Purge.Result {
        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.identifierPurgedPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.IDENTIFIER,
                actionType: ActionType.PURGE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.identifierService.purge({
                    input: { identifier: props.input.identifier, account: props.actor },
                    transaction,
                });

                return { account: props.actor };
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }
}
