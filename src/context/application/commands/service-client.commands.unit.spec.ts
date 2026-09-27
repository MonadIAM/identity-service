import { describe, expect, it } from "@jest/globals";

import { ServiceClientCommandsUnitHelpers } from "~testing/unit/command-services/service-client.helpers";
import { KafkaTopic, ServiceClientTopicAction } from "~context/enums";

const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "unit-test" };
const helpers = new ServiceClientCommandsUnitHelpers();
const ACTOR = "actor-account";
const REALM = "realm-a";
const ID = "entity-a";

describe("ServiceClientCommands", () => {
    describe("create", () => {
        it("creates a client within the actor's realm and schedules propagation", async () => {
            const { commands, serviceClientService, transaction, run } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                code: "unit.service",
                allowedAddresses: ["127.0.0.1"],
            };
            const client = helpers.createServiceClient();
            serviceClientService.create.mockResolvedValue(client);

            await commands.create({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

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

    describe("update", () => {
        it("updates a client without allowing the patch to change its realm", async () => {
            const { commands, serviceClientService, transaction } = helpers.commands();
            const input = {
                name: "Client",
                description: "Description",
                code: "unit.service",
                allowedAddresses: ["127.0.0.1"],
            };

            await commands.update({ input: { ...input, client: ID }, actor: ACTOR, realm: REALM, context: CONTEXT });

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

    describe("revoke / restore / purge", () => {
        it.each(["revoke", "restore", "purge"] as const)(
            "propagates %s with its realm, actor and changed clients",
            async (method) => {
                const { commands, serviceClientService, transaction, run } = helpers.commands();
                const entities = [helpers.createServiceClient(), helpers.createServiceClient()];
                serviceClientService[method].mockResolvedValue(entities);
                const input = { clients: [ID, "another-id", "unchanged-id"], reason: "Requested change" };

                const result = await commands[method]({ input, actor: ACTOR, realm: REALM, context: CONTEXT });

                expect(serviceClientService[method].mock.calls).toEqual([
                    [{ identifiers: input.clients, realm: REALM, transaction: transaction.entityManager }],
                ]);
                expect(result.params).toEqual({ count: 2 });
                await expect(run.mock.results[0]?.value).resolves.toEqual({ serviceClients: entities, actor: ACTOR });
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
