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

                this.assertAllFound({ entities, clients: props.input.clients });

                this.oauthClientService.revoke({ entities });
                return entities;
            },
        });

        return this.message({
            bulk: "BULK_REVOKED_COUNT",
            single: "REVOKED",
            count: entities.length,
        });
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

                this.assertAllFound({ entities, clients: props.input.clients });

                this.oauthClientService.restore({ entities });
                return entities;
            },
        });

        return this.message({
            bulk: "BULK_RESTORED_COUNT",
            single: "RESTORED",
            count: entities.length,
        });
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

                this.assertAllFound({ entities, clients: props.input.clients });

                this.oauthClientService.purge({ transaction, entities });
                return entities;
            },
        });

        return this.message({
            bulk: "BULK_PURGED_COUNT",
            single: "PURGED",
            count: entities.length,
        });
    }

    private assertAllFound(props: { entities: Entities.OAuthClient[]; clients: string[] }): void {
        if (props.entities.length < props.clients.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
        }
    }

    private message(props: { single: string; bulk: string; count: number }): MessageResult {
        if (props.count > 1) {
            return { message: `${this.dictionaryPath}.${props.bulk}`, params: { count: props.count } };
        } else {
            return { message: `${this.dictionaryPath}.${props.single}` };
        }
    }
}
