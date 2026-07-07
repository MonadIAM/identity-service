import { Inject, Injectable, Scope } from "@nestjs/common";

import { SERVICE_CLIENT_REPOSITORY, APPLICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { CRYPTO_SERVICE, HASHING_SERVICE } from "~common/services";
import { SERVICE_CLIENT_SERVICE } from "~context/domain/services";
import { ActionType, EntityType } from "~context/enums";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientCommands implements Commands.ServiceClient.Contract {
    private readonly dictionaryPath = "commands.service-client";
    private readonly resource = "ServiceClient";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.Contract,
        @Inject(SERVICE_CLIENT_REPOSITORY)
        private readonly serviceClientRepository: Repositories.ServiceClient.Contract,
        @Inject(SERVICE_CLIENT_SERVICE)
        private readonly serviceClientService: Services.ServiceClient.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
    ) {}

    public async create(props: Commands.ServiceClient.Create.Props): Commands.ServiceClient.Create.Result {
        const secret = this.cryptoService.generateToken(32);
        const clientSecretHash = await this.hashingService.hash({ value: secret });

        await this.transactionalService.run<Entities.ServiceClient>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.CREATE,
                ...props,
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
                        name: props.input.name,
                        clientSecretHash,
                        application,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED`, secret };
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

    public async regenerateSecret(
        props: Commands.ServiceClient.RegenerateSecret.Props,
    ): Commands.ServiceClient.RegenerateSecret.Result {
        const secret = this.cryptoService.generateToken(32);
        const clientSecretHash = await this.hashingService.hash({ value: secret });

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.REGENERATE,
                ...props,
            },
            execute: async (transaction) => {
                const entity = await this.serviceClientRepository.findUniqueOrThrow({
                    where: { id: props.input.client, application: { realm: props.realm } },
                    transaction,
                });

                this.serviceClientService.regenerateSecret({ entity, clientSecretHash });
            },
        });

        return { message: `${this.dictionaryPath}.SECRET_REGENERATED`, secret };
    }

    public async revoke(props: Commands.ServiceClient.Revoke.Props): Commands.ServiceClient.Revoke.Result {
        const entities = await this.transactionalService.run<Entities.ServiceClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.SERVICE_CLIENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            execute: async (transaction) => {
                const entities = await this.serviceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
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
            execute: async (transaction) => {
                const entities = await this.serviceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
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
            execute: async (transaction) => {
                const entities = await this.serviceClientRepository.find({
                    where: { id: { $in: props.input.clients }, application: { realm: props.realm } },
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
}
