import { Inject, Injectable, Scope } from "@nestjs/common";

import { InterfaceClientTopicAction, ServiceClientTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { APPLICATION_REPOSITORY } from "~context/domain/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";

import { APPLICATION_SERVICE } from "../services";
import { ApplicationMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationCommands implements Commands.Application.Contract {
    private readonly mapper: Commands.Mappers.Application.Contract;
    private readonly dictionaryPath = "commands.application";
    private readonly resource = "Application";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.PublicContract,
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
                const entity = await this.applicationRepository.findUniqueOrThrow({
                    where: {
                        id: input.application,
                        realm: realm,
                    },
                    transaction,
                });

                this.applicationService.update({
                    patch: {
                        description: input.description,
                        name: input.name,
                    },
                    entity,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.Application.Revoke.Props): Commands.Application.Revoke.Result {
        const { realm, input } = props;
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
                const entities = await this.applicationRepository.find({
                    where: {
                        id: { $in: input.applications },
                        realm,
                    },
                    options: { populate: ["interfaceClients", "serviceClients"] },
                    transaction,
                });

                if (entities.length < input.applications.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.APPLICATIONS_NOT_FOUND` });
                } else {
                    this.applicationService.revoke({ entities });
                }

                return { entities, isRevoked: true };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.Application.Restore.Props): Commands.Application.Restore.Result {
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
                const entities = await this.applicationRepository.find({
                    where: {
                        id: { $in: props.input.applications },
                        realm: props.realm,
                    },
                    options: { populate: ["interfaceClients", "serviceClients"] },
                    transaction,
                });

                if (entities.length < props.input.applications.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.APPLICATIONS_NOT_FOUND` });
                } else {
                    this.applicationService.restore({ entities });
                }

                return { entities, isRevoked: false };
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
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
                const entities = await this.applicationRepository.find({
                    where: {
                        id: { $in: props.input.applications },
                        realm: props.realm,
                    },
                    transaction,
                });

                if (entities.length < props.input.applications.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.APPLICATIONS_NOT_FOUND` });
                } else {
                    this.applicationService.purge({ transaction, entities });
                    return entities;
                }
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revokeRealm(props: Commands.Application.RevokeRealm.Props): Commands.Application.RevokeRealm.Result {
        const { version, realm } = props.input;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
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
            execute: async (transaction) => {
                const entities = await this.applicationRepository.find({
                    where: { realm },
                    options: { populate: ["interfaceClients", "serviceClients"] },
                    transaction,
                });

                this.applicationService.applyRealmRevocation({ entities, version });
                return { entities, isRevoked: true };
            },
        });
    }

    public async restoreRealm(props: Commands.Application.RestoreRealm.Props): Commands.Application.RestoreRealm.Result {
        const { version, realm } = props.input;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
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
            execute: async (transaction) => {
                const entities = await this.applicationRepository.find({
                    where: { realm },
                    options: { populate: ["interfaceClients", "serviceClients"] },
                    transaction,
                });

                this.applicationService.applyRealmRestore({ entities, version });
                return { entities, isRevoked: false };
            },
        });
    }

    public async purgeRealm(props: Commands.Application.PurgeRealm.Props): Commands.Application.PurgeRealm.Result {
        const { version, realm } = props.input;
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.PURGE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.applicationRepository.find({ transaction, where: { realm } });
                this.applicationService.purgeRealm({ transaction, entities, version });
            },
        });
    }
}
