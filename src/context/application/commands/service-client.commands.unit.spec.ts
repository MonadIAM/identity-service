import { describe, expect, it } from "@jest/globals";

import { ServiceClientCommandsUnitHelpers } from "~testing/unit/command-services/service-client.helpers";
import { KafkaTopic, ServiceClientTopicAction } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new ServiceClientCommandsUnitHelpers();
const ACTOR = "actor-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("[Commands] - ServiceClient", () => {
    describe("[Method] - create", () => {
        it("[case] - creates a client within the actor's realm and schedules propagation", async () => {
            // Arrange
            const { commands, serviceClientService, transaction, run } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                code: "unit.service",
                allowedAddresses: ["127.0.0.1"],
            };
            const client = helpers.createServiceClient();
            serviceClientService.create.mockResolvedValue(client);

            // Act
            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(serviceClientService.create.mock.calls).toEqual([
                [{ input, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(run.mock.calls).toEqual([
                [
                    expect.objectContaining({
                        outbox: expect.objectContaining({
                            destinationTopic: KafkaTopic.SERVICE_CLIENT,
                            actionType: ServiceClientTopicAction.CREATE,
                        }),
                    }),
                ],
            ]);
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a client without allowing the patch to change its realm", async () => {
            // Arrange
            const { commands, serviceClientService, transaction } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                code: "unit.service",
                allowedAddresses: ["127.0.0.1"],
            };

            // Act
            await commands.update({ input: { ...input, client: ID }, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(serviceClientService.update.mock.calls).toEqual([
                [
                    {
                        id: ID,
                        patch: {
                            name: input.name,
                            description: input.description,
                            allowedAddresses: input.allowedAddresses,
                        },
                        realm: REALM,
                        transaction: transaction.entityManager,
                    },
                ],
            ]);
        });
    });

    describe("[Behavior] - client lifecycle", () => {
        it.each(["revoke", "restore", "purge"] as const)(
            "[case] - propagates %s with its realm, actor and changed clients",
            async (method) => {
                // Arrange
                const { commands, serviceClientService, transaction, run } = helpers.commands();
                const entities = [helpers.createServiceClient(), helpers.createServiceClient()];
                serviceClientService[method].mockResolvedValue(entities);
                const input = { clients: [ID, "another-id", "unchanged-id"], reason: "Requested change" };

                // Act
                const result = await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });
                const result1 = await run.mock.results[0]?.value;

                // Assert
                expect(serviceClientService[method].mock.calls).toEqual([
                    [{ identifiers: input.clients, realm: REALM, transaction: transaction.entityManager }],
                ]);
                expect(result.params).toEqual({ count: 2 });
                expect(result1).toEqual({ serviceClients: entities, actor: ACTOR });
                expect(run.mock.calls).toEqual([
                    [
                        expect.objectContaining({
                            outbox: expect.objectContaining({
                                destinationTopic: KafkaTopic.SERVICE_CLIENT,
                                actionType:
                                    method === "revoke"
                                        ? ServiceClientTopicAction.REVOKE
                                        : method === "restore"
                                          ? ServiceClientTopicAction.RESTORE
                                          : ServiceClientTopicAction.PURGE,
                            }),
                        }),
                    ],
                ]);
            },
        );
    });
});
