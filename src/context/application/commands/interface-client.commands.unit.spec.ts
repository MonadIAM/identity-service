import { describe, expect, it } from "@jest/globals";

import { InterfaceClientCommandsUnitHelpers } from "~testing/unit/command-services/interface-client.helpers";
import { KafkaTopic, InterfaceClientTopicAction } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new InterfaceClientCommandsUnitHelpers();
const ACTOR = "actor-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("[Commands] - InterfaceClient", () => {
    describe("[Method] - create", () => {
        it("[case] - creates a client within the actor's realm and schedules propagation", async () => {
            // Arrange
            const { commands, interfaceClientService, transaction, run } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                authAddress: "https://login.example.test",
                redirectUris: ["https://app.example.test/cb"],
            };
            const client = helpers.createInterfaceClient();
            interfaceClientService.create.mockResolvedValue(client);

            // Act
            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(interfaceClientService.create.mock.calls).toEqual([
                [{ input, realm: REALM, transaction: transaction.entityManager }],
            ]);
            expect(run.mock.calls).toEqual([
                [
                    expect.objectContaining({
                        outbox: expect.objectContaining({
                            destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                            actionType: InterfaceClientTopicAction.CREATE,
                        }),
                    }),
                ],
            ]);
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a client without allowing the patch to change its realm", async () => {
            // Arrange
            const { commands, interfaceClientService, transaction } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                authAddress: "https://login.example.test",
                redirectUris: ["https://app.example.test/cb"],
            };

            // Act
            await commands.update({ input: input, client: ID, actor: ACTOR, realm: REALM, context: CONTEXT });

            // Assert
            expect(interfaceClientService.update.mock.calls).toEqual([
                [{ id: ID, patch: input, realm: REALM, transaction: transaction.entityManager }],
            ]);
        });
    });

    describe("[Behavior] - client lifecycle", () => {
        it.each(["revoke", "restore", "purge"] as const)(
            "[case] - propagates %s with its realm, actor and changed clients",
            async (method) => {
                // Arrange
                const { commands, interfaceClientService, transaction, run } = helpers.commands();
                const entities = [helpers.createInterfaceClient(), helpers.createInterfaceClient()];
                interfaceClientService[method].mockResolvedValue(entities);
                const input = { clients: [ID, "another-id", "unchanged-id"], reason: "Requested change" };

                // Act
                const result = await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });
                const result1 = await run.mock.results[0]?.value;

                // Assert
                expect(interfaceClientService[method].mock.calls).toEqual([
                    [{ identifiers: input.clients, realm: REALM, transaction: transaction.entityManager }],
                ]);
                expect(result.params).toEqual({ count: 2 });
                expect(result1).toEqual({
                    entities,
                    isRevoked: method !== "restore",
                    actor: ACTOR,
                });
                expect(run.mock.calls).toEqual([
                    [
                        expect.objectContaining({
                            outbox: expect.objectContaining({
                                destinationTopic: KafkaTopic.INTERFACE_CLIENT,
                                actionType:
                                    method === "revoke"
                                        ? InterfaceClientTopicAction.REVOKE
                                        : method === "restore"
                                          ? InterfaceClientTopicAction.RESTORE
                                          : InterfaceClientTopicAction.PURGE,
                            }),
                        }),
                    ],
                ]);
            },
        );
    });
});
