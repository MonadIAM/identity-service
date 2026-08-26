import { Inject, Injectable, Scope } from "@nestjs/common";

import { INTERFACE_CLIENT_REPOSITORY, APPLICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { InterfaceClientTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { INTERFACE_CLIENT_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";

import { InterfaceClientMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientCommands implements Commands.InterfaceClient.Contract {
    private readonly mapper: Commands.Mappers.InterfaceClient.Contract;
    private readonly dictionaryPath = "commands.interface-client";
    private readonly resource = "InterfaceClient";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.PublicContract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.PublicContract,
        @Inject(INTERFACE_CLIENT_SERVICE)
        private readonly interfaceClientService: Services.InterfaceClient.CommandContract,
    ) {
        this.mapper = new InterfaceClientMapper();
    }

    public async create(props: Commands.InterfaceClient.Create.Props): Commands.InterfaceClient.Create.Result {
        const { actor, input, realm } = props;
        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.interfaceClientPayload,
                actionType: InterfaceClientTopicAction.CREATE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const application = await this.applicationRepository.findUniqueOrThrow({
                    where: { id: input.application, realm },
                    transaction,
                });

                const entity = await this.interfaceClientService.create({
                    transaction,
                    input: {
                        description: input.description,
                        redirectUri: input.redirectUri,
                        authAddress: input.authAddress,
                        name: input.name,
                        application,
                    },
                });

                return { entities: [entity], isRevoked: false, actor };
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.InterfaceClient.Update.Props): Commands.InterfaceClient.Update.Result {
        const { client, realm, input } = props;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entity = await this.interfaceClientRepository.findUniqueOrThrow({
                    where: { id: client, application: { realm } },
                    transaction,
                });

                this.interfaceClientService.update({
                    patch: {
                        redirectUri: input.redirectUri,
                        authAddress: input.authAddress,
                        description: input.description,
                        name: input.name,
                    },
                    entity,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.InterfaceClient.Revoke.Props): Commands.InterfaceClient.Revoke.Result {
        const { input, realm, actor } = props;
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.interfaceClientPayload,
                actionType: InterfaceClientTopicAction.REVOKE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.interfaceClientRepository.find({
                    where: { id: { $in: input.clients }, application: { realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.interfaceClientService.revoke({ entities });
                return { entities, isRevoked: true, actor };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.InterfaceClient.Restore.Props): Commands.InterfaceClient.Restore.Result {
        const { realm, input, actor } = props;
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.interfaceClientPayload,
                actionType: InterfaceClientTopicAction.RESTORE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.interfaceClientRepository.find({
                    where: { id: { $in: input.clients }, application: { realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.interfaceClientService.restore({ entities });
                return { entities, isRevoked: false, actor };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.InterfaceClient.Purge.Props): Commands.InterfaceClient.Purge.Result {
        const { realm, input, actor } = props;
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.interfaceClientPayload,
                actionType: InterfaceClientTopicAction.PURGE,
                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
            },
            audit: {
                entityType: EntityType.INTERFACE_CLIENT,
                actionType: ActionType.PURGE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.interfaceClientRepository.find({
                    where: { id: { $in: input.clients }, application: { realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.interfaceClientService.purge({ transaction, entities });
                return { entities, isRevoked: true, actor };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
