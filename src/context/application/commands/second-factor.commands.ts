import { Inject, Injectable, Scope } from "@nestjs/common";

import { NotificationTopicAction, ActionType, EntityType, KafkaTopic, SecondFactorType } from "~context/enums";
import { HASHING_SERVICE, CRYPTO_SERVICE, TOTP_SERVICE } from "~common/services";
import { SECOND_FACTOR_SECRET_SERVICE } from "~context/infrastructure/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";

import { SecondFactorMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorCommands implements Commands.SecondFactor.Contract {
    private readonly mapper: Commands.Mappers.SecondFactor.Contract;
    private readonly dictionaryPath = "commands.second-factor";
    private readonly resource = "SecondFactor";

    public constructor(
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.PublicContract,
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.CommandContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.PublicContract,
        @Inject(TOTP_SERVICE)
        private readonly totpService: CommonServices.TOTP.PublicContract,
    ) {
        this.mapper = new SecondFactorMapper();
    }

    public async create(props: Commands.SecondFactor.Create.Props): Commands.SecondFactor.Create.Result {
        const secret = this.totpService.createSecret();
        const ciphertext = await this.secondFactorSecretService.encrypt({ secret });
        const type = SecondFactorType.TOTP;

        const factor = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.secondFactorService.create({
                    transaction,
                    input: {
                        name: props.input.name,
                        account: props.actor,
                        secret: ciphertext,
                        type,
                    },
                });
            },
        });

        const uri = this.totpService.createURI({ label: props.actor, secret });

        return { id: factor.id, uri };
    }

    public async verify(props: Commands.SecondFactor.Verify.Props): Commands.SecondFactor.Verify.Result {
        const masterCodePlaintext = this.cryptoService.generateRecoveryCode();
        const masterCodeHash = await this.hashingService.hash({ value: masterCodePlaintext });
        let hasMasterCode = false;

        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.secondFactorEnabledPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.VERIFY,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const factor = await this.secondFactorService.verify({
                    input: {
                        factor: props.input.factor,
                        code: props.input.code,
                        account: props.actor,
                        masterCodeHash,
                    },
                    transaction,
                });

                hasMasterCode = Boolean(factor.account.masterCode && factor.account.masterCode.hash !== masterCodeHash);

                return { account: props.actor };
            },
        });

        return {
            message: `${this.dictionaryPath}.VERIFIED`,
            code: hasMasterCode ? undefined : masterCodePlaintext,
        };
    }

    public async reset(props: Commands.SecondFactor.Reset.Props): Commands.SecondFactor.Reset.Result {
        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.secondFactorResetPayload,
                actionType: NotificationTopicAction.CREATE,
                destinationTopic: KafkaTopic.NOTIFICATION,
            },
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.RESET,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const account = await this.secondFactorService.reset({
                    input: { identifier: props.input.identifier, code: props.input.code },
                    transaction,
                });

                return { account: account.id };
            },
        });

        return { message: `${this.dictionaryPath}.RESET` };
    }

    public async purge(props: Commands.SecondFactor.Purge.Props): Commands.SecondFactor.Purge.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.PURGE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.secondFactorService.purge({
                    input: { target: props.input.factor, account: props.actor },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }
}
