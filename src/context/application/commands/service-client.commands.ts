import { Inject, Injectable, Scope } from "@nestjs/common";

import { ServiceClientTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { SERVICE_CLIENT_SERVICE } from "~context/domain/services";

import { ServiceClientMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientCommands implements Commands.ServiceClient.Contract {
    private readonly mapper: Commands.Mappers.ServiceClient.Contract;
    private readonly dictionaryPath = "commands.service-client";
    private readonly resource = "ServiceClient";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(SERVICE_CLIENT_SERVICE)
        private readonly serviceClientService: Services.ServiceClient.CommandContract,
    ) {
        this.mapper = new ServiceClientMapper();
    }

    public async create(props: Commands.ServiceClient.Create.Props): Commands.ServiceClient.Create.Result {
        const { input, realm, actor } = props;
        await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.serviceClientPayload,
                actionType: ServiceClientTopicAction.CREATE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const serviceClient = await this.serviceClientService.create({
                    transaction,
                    realm,
                    input: {
                        allowedAddresses: input.allowedAddresses,
                        description: input.description,
                        application: input.application,
                        code: input.code,
                        name: input.name,
                    },
                });

                return { serviceClients: serviceClient, actor };
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.ServiceClient.Update.Props): Commands.ServiceClient.Update.Result {
        const { input, realm } = props;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.serviceClientService.update({
                    patch: {
                        allowedAddresses: input.allowedAddresses,
                        description: input.description,
                        name: input.name,
                    },
                    id: input.client,
                    transaction,
                    realm,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.ServiceClient.Revoke.Props): Commands.ServiceClient.Revoke.Result {
        const { realm, actor, input } = props;
        const { serviceClients } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.serviceClientPayload,
                actionType: ServiceClientTopicAction.REVOKE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.serviceClientService.revoke({
                    identifiers: input.clients,
                    transaction,
                    realm,
                });

                return { serviceClients: entities, actor };
            },
        });

        const entities = Array.isArray(serviceClients) ? serviceClients : [serviceClients];

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.ServiceClient.Restore.Props): Commands.ServiceClient.Restore.Result {
        const { realm, input, actor } = props;
        const { serviceClients } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.serviceClientPayload,
                actionType: ServiceClientTopicAction.RESTORE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.serviceClientService.restore({
                    identifiers: input.clients,
                    transaction,
                    realm,
                });

                return { serviceClients: entities, actor };
            },
        });

        const entities = Array.isArray(serviceClients) ? serviceClients : [serviceClients];

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.ServiceClient.Purge.Props): Commands.ServiceClient.Purge.Result {
        const { input, realm, actor } = props;
        const { serviceClients } = await this.transactionalService.run({
            resource: this.resource,
            outbox: {
                payloadMapper: this.mapper.serviceClientPayload,
                actionType: ServiceClientTopicAction.PURGE,
                destinationTopic: KafkaTopic.SERVICE_CLIENT,
            },
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.PURGE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.serviceClientService.purge({
                    identifiers: input.clients,
                    transaction,
                    realm,
                });

                return { serviceClients: entities, actor };
            },
        });

        const entities = Array.isArray(serviceClients) ? serviceClients : [serviceClients];

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
