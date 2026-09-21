import { describe, expect, it } from "@jest/globals";

import { RealmCommandsUnitHelpers } from "~testing/unit/command-services/realm.helpers";
import { KafkaTopic } from "~context/enums";

const INCOMING: TransactionManager.Service.IncomingMessage = { consumerKey: "unit-consumer", event: "incoming-event" };
const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new RealmCommandsUnitHelpers();
const ACTOR = "actor-account";
const REALM = "realm-a";

describe("RealmCommands", () => {
    it.each([
        { command: "revokeRealm", method: "applyRealmRevocation", isRevoked: true },
        { command: "restoreRealm", method: "applyRealmRestore", isRevoked: false },
        { command: "purgeRealm", method: "purgeRealm", isRevoked: true },
    ] as const)(
        "$command applies the event version to both client types in the same transaction",
        async ({ command, method, isRevoked }) => {
            const { commands, interfaceClientService, serviceClientService, consume, transaction } = helpers.commands();
            const interfaceClients = [helpers.createInterfaceClient()];
            const serviceClients = [helpers.createServiceClient()];
            interfaceClientService[method].mockResolvedValue(interfaceClients);
            serviceClientService[method].mockResolvedValue(serviceClients);

            await commands[command]({
                input: { version: 7 },
                actor: ACTOR,
                realm: REALM,
                context: CONTEXT,
                incoming: INCOMING,
            });

            expect(interfaceClientService[method].mock.calls).toEqual([
                [{ version: 7, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(serviceClientService[method].mock.calls).toEqual([
                [{ version: 7, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(consume.mock.calls).toEqual([
                [
                    expect.objectContaining({
                        incoming: INCOMING,
                        outbox: [
                            expect.objectContaining({ destinationTopic: KafkaTopic.INTERFACE_CLIENT }),
                            expect.objectContaining({ destinationTopic: KafkaTopic.SERVICE_CLIENT }),
                        ],
                    }),
                ],
            ]);
            await expect(consume.mock.results[0]?.value).resolves.toEqual({
                status: "processed",
                value: { interfaceClients, serviceClients, isRevoked, actor: ACTOR },
            });
        },
    );
});
