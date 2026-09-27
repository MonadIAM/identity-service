import { describe, expect, it } from "@jest/globals";

import { InterfaceClientCommandsUnitHelpers } from "~testing/unit/command-services/interface-client.helpers";
import { KafkaTopic, InterfaceClientTopicAction } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new InterfaceClientCommandsUnitHelpers();
const ACTOR = "actor-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("InterfaceClientCommands", () => {
    describe("create", () => {
        it("creates a client within the actor's realm and schedules propagation", async () => {
            const { commands, interfaceClientService, transaction, run } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                authAddress: "https://login.example.test",
                redirectUris: ["https://app.example.test/cb"],
            };
            const client = helpers.createInterfaceClient();
            interfaceClientService.create.mockResolvedValue(client);

            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

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

    describe("update", () => {
        it("updates a client without allowing the patch to change its realm", async () => {
            const { commands, interfaceClientService, transaction } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                authAddress: "https://login.example.test",
                redirectUris: ["https://app.example.test/cb"],
            };

            await commands.update({ input: input, client: ID, actor: ACTOR, realm: REALM, context: CONTEXT });

            expect(interfaceClientService.update.mock.calls).toEqual([
                [{ id: ID, patch: input, realm: REALM, transaction: transaction.entityManager }],
            ]);
        });
    });

    describe("revoke / restore / purge", () => {
        it.each(["revoke", "restore", "purge"] as const)(
            "propagates %s with its realm, actor and changed clients",
            async (method) => {
                const { commands, interfaceClientService, transaction, run } = helpers.commands();
                const entities = [helpers.createInterfaceClient(), helpers.createInterfaceClient()];
                interfaceClientService[method].mockResolvedValue(entities);
                const input = { clients: [ID, "another-id", "unchanged-id"], reason: "Requested change" };

                const result = await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

                expect(interfaceClientService[method].mock.calls).toEqual([
                    [{ identifiers: input.clients, realm: REALM, transaction: transaction.entityManager }],
                ]);
                expect(result.params).toEqual({ count: 2 });
                await expect(run.mock.results[0]?.value).resolves.toEqual({
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
