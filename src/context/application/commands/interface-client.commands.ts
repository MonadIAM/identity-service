import { InterfaceClientTopicAction } from "@monadiam/shared";
import { Inject, Injectable, Scope } from "@nestjs/common";

import { INTERFACE_CLIENT_REPOSITORY, APPLICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { INTERFACE_CLIENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientCommands implements Commands.InterfaceClient.Contract {
    private readonly dictionaryPath = "commands.interface-client";
    private readonly resource = "InterfaceClient";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.Contract,
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.Contract,
        @Inject(INTERFACE_CLIENT_SERVICE)
        private readonly interfaceClientService: Services.InterfaceClient.Contract,
    ) {}

    public async create(props: Commands.InterfaceClient.Create.Props): Commands.InterfaceClient.Create.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.CREATE,
                ...props,
            },
            outbox: {
                payloadMapper: this.interfaceClientPayloadMapper.bind(this),
                actionType: InterfaceClientTopicAction.CREATE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            execute: async (transaction) => {
                const application = await this.applicationRepository.findUniqueOrThrow({
                    where: { id: props.input.application, realm: props.realm },
                    transaction,
                });

                const entity = await this.interfaceClientService.create({
                    transaction,
                    input: {
                        description: props.input.description,
                        redirectUri: props.input.redirectUri,
                        authAddress: props.input.authAddress,
                        name: props.input.name,
                        application,
                    },
                });

                return { entities: [entity], isRevoked: false };
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.InterfaceClient.Update.Props): Commands.InterfaceClient.Update.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.UPDATE,
                ...props,
            },
            execute: async (transaction) => {
                const entity = await this.interfaceClientRepository.findUniqueOrThrow({
                    where: { id: props.client, application: { realm: props.realm } },
                    transaction,
                });

                this.interfaceClientService.update({
                    patch: {
                        redirectUri: props.input.redirectUri,
                        authAddress: props.input.authAddress,
                        description: props.input.description,
                        name: props.input.name,
                    },
                    entity,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.InterfaceClient.Revoke.Props): Commands.InterfaceClient.Revoke.Result {
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            outbox: {
                payloadMapper: this.interfaceClientPayloadMapper.bind(this),
                actionType: InterfaceClientTopicAction.REVOKE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            execute: async (transaction) => {
                const entities = await this.interfaceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.interfaceClientService.revoke({ entities });
                return { entities, isRevoked: true };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.InterfaceClient.Restore.Props): Commands.InterfaceClient.Restore.Result {
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            outbox: {
                payloadMapper: this.interfaceClientPayloadMapper.bind(this),
                actionType: InterfaceClientTopicAction.RESTORE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            execute: async (transaction) => {
                const entities = await this.interfaceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.interfaceClientService.restore({ entities });
                return { entities, isRevoked: false };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.InterfaceClient.Purge.Props): Commands.InterfaceClient.Purge.Result {
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.PURGE,
                ...props,
            },
            outbox: {
                payloadMapper: this.interfaceClientPayloadMapper.bind(this),
                actionType: InterfaceClientTopicAction.PURGE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            execute: async (transaction) => {
                const entities = await this.interfaceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.interfaceClientService.purge({ transaction, entities });
                return { entities, isRevoked: true };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public interfaceClientPayloadMapper(
        props: Commands.InterfaceClient.InterfaceClientPayloadMapper.Props,
    ): Commands.InterfaceClient.InterfaceClientPayloadMapper.Result {
        return props.entities.map(({ id, application }) => ({
            application: application.id,
            isRevoked: props.isRevoked,
            realm: application.realm,
            id,
        }));
    }
}
