import { Inject, Injectable, Scope } from "@nestjs/common";

import { InterfaceClientTopicAction, ServiceClientTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { APPLICATION_SERVICE } from "~context/domain/services";

import { ApplicationMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationCommands implements Commands.Application.Contract {
    private readonly mapper: Commands.Mappers.Application.Contract;
    private readonly dictionaryPath = "commands.application";
    private readonly resource = "Application";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(APPLICATION_SERVICE)
        private readonly applicationService: Services.Application.CommandContract,
    ) {
        this.mapper = new ApplicationMapper();
    }

    public async create(props: Commands.Application.Create.Props): Commands.Application.Create.Result {
        const { realm, input } = props;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: (transaction) => {
                return this.applicationService.create({
                    transaction,
                    input: {
                        realm: realm,
                        ...input,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.Application.Update.Props): Commands.Application.Update.Result {
        const { realm, input } = props;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.applicationService.update({
                    patch: {
                        description: input.description,
                        name: input.name,
                    },
                    id: input.application,
                    transaction,
                    realm,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.Application.Revoke.Props): Commands.Application.Revoke.Result {
        const { realm, actor, input } = props;
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientOutboxPayload,
                    actionType: InterfaceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientOutboxPayload,
                    actionType: ServiceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.applicationService.revoke({
                    identifiers: input.applications,
                    transaction,
                    realm,
                });

                return { entities, isRevoked: true, actor };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Application.Restore.Props): Commands.Application.Restore.Result {
        const { actor } = props;
        const { entities } = await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientOutboxPayload,
                    actionType: InterfaceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientOutboxPayload,
                    actionType: ServiceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.applicationService.restore({
                    identifiers: props.input.applications,
                    realm: props.realm,
                    transaction,
                });

                return { entities, isRevoked: false, actor };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async revokeRealm(props: Commands.Application.RevokeRealm.Props): Commands.Application.RevokeRealm.Result {
        const { incoming, context, actor, realm, input } = props;
        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.REVOKE,
                context,
                actor,
                realm,
                input,
            },
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientOutboxPayload,
                    actionType: InterfaceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientOutboxPayload,
                    actionType: ServiceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const entities = await this.applicationService.applyRealmRevocation({
                    version: input.version,
                    transaction,
                    realm,
                });

                return { entities, isRevoked: true, actor };
            },
        });
    }

    public async restoreRealm(props: Commands.Application.RestoreRealm.Props): Commands.Application.RestoreRealm.Result {
        const { incoming, context, actor, realm, input } = props;
        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.RESTORE,
                context,
                actor,
                realm,
                input,
            },
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientOutboxPayload,
                    actionType: InterfaceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientOutboxPayload,
                    actionType: ServiceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const entities = await this.applicationService.applyRealmRestore({
                    version: input.version,
                    transaction,
                    realm,
                });

                return { entities, isRevoked: false, actor };
            },
        });
    }

    public async purge(props: Commands.Application.Purge.Props): Commands.Application.Purge.Result {
        const entities = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.PURGE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.applicationService.purge({
                    identifiers: props.input.applications,
                    realm: props.realm,
                    transaction,
                });
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async purgeRealm(props: Commands.Application.PurgeRealm.Props): Commands.Application.PurgeRealm.Result {
        const { incoming, context, actor, realm, input } = props;
        const { version } = input;
        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.PURGE,
                context,
                actor,
                realm,
                input,
            },
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                await this.applicationService.purgeRealm({ transaction, version, realm });
            },
        });
    }
}
