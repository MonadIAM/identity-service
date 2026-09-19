import { Inject, Injectable, Scope } from "@nestjs/common";

import { InterfaceClientTopicAction, ServiceClientTopicAction, ActionType, EntityType, KafkaTopic } from "~context/enums";
import { INTERFACE_CLIENT_SERVICE, SERVICE_CLIENT_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";

import { RealmMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RealmCommands implements Commands.Realm.Contract {
    private readonly mapper: Commands.Mappers.Realm.Contract;
    private readonly resource = "Realm";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(INTERFACE_CLIENT_SERVICE)
        private readonly interfaceClientService: Services.InterfaceClient.CommandContract,
        @Inject(SERVICE_CLIENT_SERVICE)
        private readonly serviceClientService: Services.ServiceClient.CommandContract,
    ) {
        this.mapper = new RealmMapper();
    }

    public async revokeRealm(props: Commands.Realm.RevokeRealm.Props): Commands.Realm.RevokeRealm.Result {
        const { incoming, context, actor, realm, input } = props;
        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.REVOKE,
                context,
                actor,
                realm,
                input,
            },
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientPayload,
                    actionType: InterfaceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientPayload,
                    actionType: ServiceClientTopicAction.REVOKE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const [interfaceClients, serviceClients] = await Promise.all([
                    this.interfaceClientService.applyRealmRevocation({ version: input.version, transaction, realm }),
                    this.serviceClientService.applyRealmRevocation({ version: input.version, transaction, realm }),
                ]);

                return { interfaceClients, serviceClients, isRevoked: true, actor };
            },
        });
    }

    public async restoreRealm(props: Commands.Realm.RestoreRealm.Props): Commands.Realm.RestoreRealm.Result {
        const { incoming, context, actor, realm, input } = props;
        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.RESTORE,
                context,
                actor,
                realm,
                input,
            },
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientPayload,
                    actionType: InterfaceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientPayload,
                    actionType: ServiceClientTopicAction.RESTORE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const [interfaceClients, serviceClients] = await Promise.all([
                    this.interfaceClientService.applyRealmRestore({ version: input.version, transaction, realm }),
                    this.serviceClientService.applyRealmRestore({ version: input.version, transaction, realm }),
                ]);

                return { interfaceClients, serviceClients, isRevoked: false, actor };
            },
        });
    }

    public async purgeRealm(props: Commands.Realm.PurgeRealm.Props): Commands.Realm.PurgeRealm.Result {
        const { incoming, context, actor, realm, input } = props;
        await this.transactionalService.consume({
            resource: this.resource,
            audit: {
                entityType: EntityType.REALM,
                actionType: ActionType.PURGE,
                context,
                actor,
                realm,
                input,
            },
            outbox: [
                {
                    payloadMapper: this.mapper.interfaceClientPayload,
                    actionType: InterfaceClientTopicAction.PURGE,
                    destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                },
                {
                    payloadMapper: this.mapper.serviceClientPayload,
                    actionType: ServiceClientTopicAction.PURGE,
                    destinationTopic: KafkaTopic.SERVICE_CLIENT,
                },
            ],
            changeLog: true,
            incoming,
            execute: async (transaction) => {
                const [interfaceClients, serviceClients] = await Promise.all([
                    this.interfaceClientService.purgeRealm({ version: input.version, transaction, realm }),
                    this.serviceClientService.purgeRealm({ version: input.version, transaction, realm }),
                ]);

                return { interfaceClients, serviceClients, isRevoked: true, actor };
            },
        });
    }
}
