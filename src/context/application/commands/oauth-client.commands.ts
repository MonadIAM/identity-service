import { Inject, Injectable, Scope } from "@nestjs/common";

import { OAUTH_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { OAUTH_CLIENT_SERVICE } from "~context/domain/services";
import { ActionType, EntityType } from "~context/enums";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthClientCommands implements Commands.OAuthClient.Contract {
    private readonly dictionaryPath = "commands.oauth-client";
    private readonly resource = "OAuthClient";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(OAUTH_CLIENT_REPOSITORY)
        private readonly oauthClientRepository: Repositories.OAuthClient.Contract,
        @Inject(OAUTH_CLIENT_SERVICE)
        private readonly oauthClientService: Services.OAuthClient.Contract,
    ) {}

    public async create(props: Commands.OAuthClient.Create.Props): Commands.OAuthClient.Create.Result {
        await this.transactionalService.run<Entities.OAuthClient>({
            resource: this.resource,
            audit: {
                entityType: EntityType.OAUTH_CLIENT,
                actionType: ActionType.CREATE,
                ...props,
            },
            execute: (transaction) => {
                return this.oauthClientService.create({
                    transaction,
                    input: {
                        ...props.input,
                        realm: props.realm,
                    },
                });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.OAuthClient.Update.Props): Commands.OAuthClient.Update.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.OAUTH_CLIENT,
                actionType: ActionType.UPDATE,
                ...props,
            },
            execute: async (transaction) => {
                const entity = await this.oauthClientRepository.findUniqueOrThrow({
                    where: {
                        id: props.input.client,
                        realm: props.realm,
                    },
                    transaction,
                });

                this.oauthClientService.update({
                    patch: {
                        description: props.input.description,
                        redirectUri: props.input.redirectUri,
                        name: props.input.name,
                    },
                    entity,
                });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.OAuthClient.Revoke.Props): Commands.OAuthClient.Revoke.Result {
        const entities = await this.transactionalService.run<Entities.OAuthClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.OAUTH_CLIENT,
                actionType: ActionType.REVOKE,
                ...props,
            },
            execute: async (transaction) => {
                const entities = await this.oauthClientRepository.find({
                    where: {
                        id: { $in: props.input.clients },
                        realm: props.realm,
                    },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.oauthClientService.revoke({ entities });
                return entities;
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.OAuthClient.Restore.Props): Commands.OAuthClient.Restore.Result {
        const entities = await this.transactionalService.run<Entities.OAuthClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.OAUTH_CLIENT,
                actionType: ActionType.RESTORE,
                ...props,
            },
            execute: async (transaction) => {
                const entities = await this.oauthClientRepository.find({
                    where: {
                        id: { $in: props.input.clients },
                        realm: props.realm,
                    },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.oauthClientService.restore({ entities });
                return entities;
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.OAuthClient.Purge.Props): Commands.OAuthClient.Purge.Result {
        const entities = await this.transactionalService.run<Entities.OAuthClient[]>({
            resource: this.resource,
            audit: {
                entityType: EntityType.OAUTH_CLIENT,
                actionType: ActionType.PURGE,
                ...props,
            },
            execute: async (transaction) => {
                const entities = await this.oauthClientRepository.find({
                    where: {
                        id: { $in: props.input.clients },
                        realm: props.realm,
                    },
                    transaction,
                });

                if (entities.length < props.input.clients.length) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
                }

                this.oauthClientService.purge({ transaction, entities });
                return entities;
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }

    public async revokeRealm(props: Commands.OAuthClient.RevokeRealm.Props): Commands.OAuthClient.RevokeRealm.Result {
        await this.transactionalService.run({
            resource: this.resource,
            execute: async (transaction) => {
                const entities = await this.oauthClientRepository.find({ transaction, where: { realm: props.realm } });

                this.oauthClientService.applyRealmRevocation({
                    version: props.version,
                    entities,
                });
            },
        });
    }

    public async restoreRealm(props: Commands.OAuthClient.RestoreRealm.Props): Commands.OAuthClient.RestoreRealm.Result {
        await this.transactionalService.run({
            resource: this.resource,
            execute: async (transaction) => {
                const entities = await this.oauthClientRepository.find({ transaction, where: { realm: props.realm } });

                this.oauthClientService.applyRealmRestore({
                    version: props.version,
                    entities,
                });
            },
        });
    }

    public async purgeRealm(props: Commands.OAuthClient.PurgeRealm.Props): Commands.OAuthClient.PurgeRealm.Result {
        await this.transactionalService.run({
            resource: this.resource,
            execute: async (transaction) => {
                const entities = await this.oauthClientRepository.find({ transaction, where: { realm: props.realm } });

                this.oauthClientService.purgeRealm({
                    version: props.version,
                    transaction,
                    entities,
                });
            },
        });
    }
}
