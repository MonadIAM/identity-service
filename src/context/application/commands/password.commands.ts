import { Inject, Injectable, Scope } from "@nestjs/common";

import { NotificationTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { OTP_CACHE_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { PASSWORD_SERVICE } from "~context/domain/services";
import { CRYPTO_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { PasswordMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordCommands implements Commands.Password.Contract {
    private readonly mapper: Commands.Mappers.Password.Contract;
    private readonly dictionaryPath = "commands.password";
    private readonly resource = "Password";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(PASSWORD_SERVICE)
        private readonly passwordService: Services.Password.CommandContract,
        @Inject(OTP_CACHE_SERVICE)
        private readonly otpCacheService: InfrastructureServices.OTPCache.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
    ) {
        this.mapper = new PasswordMapper();
    }

    public async change(props: Commands.Password.Change.Props): Commands.Password.Change.Result {
        return await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.passwordChangedPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.passwordService.change({
                    input: {
                        currentPassword: props.input.currentPassword,
                        newPassword: props.input.newPassword,
                        account: props.actor,
                    },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.CHANGED`, account: props.actor };
            },
        });
    }

    public async requestOTP(props: Commands.Password.RequestOTP.Props): Commands.Password.RequestOTP.Result {
        const identifier = await this.identifierRepository.findUnique({
            where: { identity: props.input.identifier },
            options: { populate: ["account"] },
        });

        if (identifier?.isVerified) {
            const otp = this.cryptoService.generateOTP();

            await this.otpCacheService.set({
                value: identifier.account.id,
                purpose: "reset",
                key: otp,
            });

            await this.transactionalService.emit({
                payload: this.mapper.notificationPayload({ account: identifier.account.id, otp }),
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
                resource: this.resource,
                audit: {
                    actionType: ActionType.REGENERATE,
                    entityType: EntityType.PASSWORD,
                    ...props,
                },
            });
        }

        return { message: `${this.dictionaryPath}.RESET_CODE_SENT` };
    }

    public async resetByOTP(props: Commands.Password.ResetByOTP.Props): Commands.Password.ResetByOTP.Result {
        const cachedAccount = await this.otpCacheService.consume({
            key: props.input.code,
            purpose: "reset",
        });

        if (cachedAccount) {
            return await this.transactionalService.run({
                resource: this.resource,
                outbox: {
                    payloadMapper: this.mapper.passwordChangedViaOtpPayload,
                    actionType: NotificationTopicAction.CREATE,
                    destinationTopic: KafkaTopic.NOTIFICATION,
                },
                audit: {
                    entityType: EntityType.PASSWORD,
                    actionType: ActionType.RESET,
                    ...props,
                },
                changeLog: true,
                execute: async (transaction) => {
                    await this.passwordService.resetByOTP({
                        input: { password: props.input.password, account: cachedAccount },
                        transaction,
                    });

                    return { message: `${this.dictionaryPath}.RESET`, account: cachedAccount };
                },
            });
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_OR_EXPIRED_CODE` });
        }
    }

    public async resetByRecoveryCode(
        props: Commands.Password.ResetByRecoveryCode.Props,
    ): Commands.Password.ResetByRecoveryCode.Result {
        return await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.passwordChangedViaRecoveryCodePayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.PASSWORD,
                actionType: ActionType.RESET,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const account = await this.passwordService.resetByRecoveryCode({
                    input: {
                        identifier: props.input.identifier,
                        password: props.input.password,
                        code: props.input.code,
                    },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.RESET`, account: account.id };
            },
        });
    }
}
