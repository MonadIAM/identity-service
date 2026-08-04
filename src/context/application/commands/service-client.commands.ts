import { ServiceClientTopicAction } from "@monadiam/shared";
import { Inject, Injectable, Scope } from "@nestjs/common";

import { SERVICE_CLIENT_REPOSITORY, APPLICATION_REPOSITORY } from "~context/domain/repositories";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";

import { SERVICE_CLIENT_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientCommands implements Commands.ServiceClient.Contract {
    private readonly dictionaryPath = "commands.service-client";
    private readonly resource = "ServiceClient";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(SERVICE_CLIENT_REPOSITORY)
        private readonly serviceClientRepository: Repositories.ServiceClient.PublicContract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.PublicContract,
        @Inject(SERVICE_CLIENT_SERVICE)
        private readonly serviceClientService: Services.ServiceClient.CommandContract,
    ) {}

    public async create(props: Commands.ServiceClient.Create.Props): Commands.ServiceClient.Create.Result {
        await this.transactionalService.run<Entities.ServiceClient>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.CREATE,
                ...props,
            },
            outbox: {
                payloadMapper: this.serviceClientPayloadMapper.bind(this),
                actionType: ServiceClientTopicAction.CREATE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            execute: async (transaction) => {
                const application = await this.applicationRepository.findUniqueOrThrow({
                    where: { id: props.input.application, realm: props.realm },
                    transaction,
                });

                return this.serviceClientService.create({
                    transaction,
                    input: {
                        description: props.input.description,
                        allowedAddresses: props.input.allowedAddresses,
                        code: props.input.code,
                        name: props.input.name,
                        application,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.ServiceClient.Update.Props): Commands.ServiceClient.Update.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.UPDATE,
                ...props,
            },
            execute: async (transaction) => {
                const entity = await this.serviceClientRepository.findUniqueOrThrow({
                    where: { id: props.input.client, application: { realm: props.realm } },
                    transaction,
                });

                this.serviceClientService.update({
                    patch: {
                        allowedAddresses: props.input.allowedAddresses,
                        description: props.input.description,
                        name: props.input.name,
                    },
                    entity,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.ServiceClient.Revoke.Props): Commands.ServiceClient.Revoke.Result {
        const entities = await this.transactionalService.run<Entities.ServiceClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            outbox: {
                payloadMapper: this.serviceClientPayloadMapper.bind(this),
                actionType: ServiceClientTopicAction.REVOKE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            execute: async (transaction) => {
                const entities = await this.serviceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.serviceClientService.revoke({ entities });
                return entities;
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.ServiceClient.Restore.Props): Commands.ServiceClient.Restore.Result {
        const entities = await this.transactionalService.run<Entities.ServiceClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            outbox: {
                payloadMapper: this.serviceClientPayloadMapper.bind(this),
                actionType: ServiceClientTopicAction.RESTORE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            execute: async (transaction) => {
                const entities = await this.serviceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.serviceClientService.restore({ entities });
                return entities;
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.ServiceClient.Purge.Props): Commands.ServiceClient.Purge.Result {
        const entities = await this.transactionalService.run<Entities.ServiceClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.PURGE,
                ...props,
            },
            outbox: {
                payloadMapper: this.serviceClientPayloadMapper.bind(this),
                actionType: ServiceClientTopicAction.PURGE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            execute: async (transaction) => {
                const entities = await this.serviceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
                    options: { populate: ["application"] },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.serviceClientService.purge({ transaction, entities });
                return entities;
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public serviceClientPayloadMapper(
        props: Commands.ServiceClient.ServiceClientPayloadMapper.Props,
    ): Commands.ServiceClient.ServiceClientPayloadMapper.Result {
        if (Array.isArray(props)) {
            return props.map(({ id, application, code }) => ({ application: application.id, code, id }));
        } else {
            return { application: props.application.id, code: props.code, id: props.id };
        }
    }
}
