import { InterfaceClientTopicAction, ServiceClientTopicAction } from "@monadiam/shared";
import { Inject, Injectable, Scope } from "@nestjs/common";

import { APPLICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { ActionType, EntityType, KafkaTopic } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { APPLICATION_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationCommands implements Commands.Application.Contract {
    private readonly dictionaryPath = "commands.application";
    private readonly resource = "Application";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.Contract,
        @Inject(APPLICATION_SERVICE)
        private readonly applicationService: Services.Application.Contract,
    ) {}

    public async create(props: Commands.Application.Create.Props): Commands.Application.Create.Result {
        const { realm, input } = props;
        await this.transactionalService.run<Entities.Application>({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.CREATE,
                ...props,
            },
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
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.REVOKE,
                ...props,
            },
            outbox: [
                {
                    payloadMapper: this.interfaceClientOutboxPayloadMapper.bind(this),
                    actionType: InterfaceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.serviceClientOutboxPayloadMapper.bind(this),
                    actionType: ServiceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
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
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.RESTORE,
                ...props,
            },
            outbox: [
                {
                    payloadMapper: this.interfaceClientOutboxPayloadMapper.bind(this),
                    actionType: InterfaceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.serviceClientOutboxPayloadMapper.bind(this),
                    actionType: ServiceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
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
        const entities = await this.transactionalService.run<Entities.Application[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.APPLICATION,
                actionType: ActionType.PURGE,
                ...props,
            },
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
        const { version, realm } = props;
        await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.interfaceClientOutboxPayloadMapper.bind(this),
                    actionType: InterfaceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.serviceClientOutboxPayloadMapper.bind(this),
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
        const { version, realm } = props;
        await this.transactionalService.run({
            resource: this.resource,
            outbox: [
                {
                    payloadMapper: this.interfaceClientOutboxPayloadMapper.bind(this),
                    actionType: InterfaceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.serviceClientOutboxPayloadMapper.bind(this),
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
        const { version, realm } = props;
        await this.transactionalService.run({
            resource: this.resource,
            execute: async (transaction) => {
                const entities = await this.applicationRepository.find({ transaction, where: { realm } });
                this.applicationService.purgeRealm({ transaction, entities, version });
            },
        });
    }

    public interfaceClientOutboxPayloadMapper(
        props: Commands.Application.InterfaceClientOutboxPayloadMapper.Props,
    ): Commands.Application.InterfaceClientOutboxPayloadMapper.Result {
        const { entities, isRevoked } = props;

        return entities.flatMap((application) =>
            application.interfaceClients.getItems().map((client) => ({
                application: application.id,
                realm: application.realm,
                id: client.id,
                isRevoked,
            })),
        );
    }

    public serviceClientOutboxPayloadMapper(
        props: Commands.Application.ServiceClientOutboxPayloadMapper.Props,
    ): Commands.Application.ServiceClientOutboxPayloadMapper.Result {
        return props.entities.flatMap((application) =>
            application.serviceClients.getItems().map((client) => ({
                application: application.id,
                code: client.code,
                id: client.id,
            })),
        );
    }
}
