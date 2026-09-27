import { describe, expect, it } from "@jest/globals";

import { ServiceClientIntegrationHelpers } from "~testing/integration/domain-service/service-client.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { ServiceClient } from "~context/domain/entities";

const REALM_ID = "00000000-0000-4000-8000-000000000041";
const helpers = new ServiceClientIntegrationHelpers();

async function loadClients(
    suite: Integration.Domain.ServiceClient.Suite,
    realm: string,
): Promise<Entities.ServiceClient[]> {
    return await suite.transaction((transaction) =>
        transaction.find(ServiceClient, { realm }, { orderBy: { name: "asc" } }),
    );
}

describe("ServiceClientService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("create", () => {
        it("creates service clients while enforcing repository-backed limits", async () => {
            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.create({
                    input: {
                        allowedAddresses: ["10.0.0.1"],
                        code: "worker",
                        name: "Worker",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await suite.fixtures().createServiceClient({
                realm: REALM_ID,
                name: "Existing Worker",
                code: "existing-worker",
            });

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().serviceClientService.create({
                        input: {
                            code: "blocked-worker",
                            name: "Blocked Worker",
                        },
                        realm: REALM_ID,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.service-client.REALM_LIMIT_EXCEEDED");

            await expect(loadClients(suite, REALM_ID)).resolves.toHaveLength(2);
        });
    });

    describe("update / revoke / restore / purge", () => {
        it("updates, revokes, restores and purges only clients scoped to the requested realm", async () => {
            const client = await suite.fixtures().createServiceClient({
                realm: REALM_ID,
                name: "Worker",
                code: "worker",
            });

            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.update({
                    patch: {
                        allowedAddresses: ["10.0.0.2"],
                        name: "Worker Client",
                    },
                    id: client.id,
                    realm: REALM_ID,
                    transaction,
                }),
            );

            let clients = await loadClients(suite, REALM_ID);

            expect(clients[0]).toMatchObject({
                allowedAddresses: ["10.0.0.2"],
                name: "Worker Client",
            });

            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.revoke({
                    identifiers: [client.id, client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );

            clients = await loadClients(suite, REALM_ID);

            expect(clients[0]?.isRevoked).toBe(true);

            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.restore({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );

            clients = await loadClients(suite, REALM_ID);

            expect(clients[0]?.isRevoked).toBe(false);

            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.revoke({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.purge({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );

            await expect(loadClients(suite, REALM_ID)).resolves.toHaveLength(0);
        });
    });

    describe("applyRealmRevocation / applyRealmRestore", () => {
        it("applies only newer realm events and preserves manual revocation", async () => {
            const client = await suite.fixtures().createServiceClient({ realm: REALM_ID, isRevoked: true });
            const other = await suite.fixtures().createServiceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });
            const system = await suite.fixtures().createServiceClient({ realm: REALM_ID, isSystemManaged: true });

            const revoked = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );

            expect(revoked.map((entity) => entity.id)).toEqual([client.id]);
            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(ServiceClient, client.id)),
            ).resolves.toMatchObject({
                realmVersion: 2,
                isRealmRevoked: true,
                isRevoked: true,
            });

            const stale = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 1 }),
            );
            const duplicate = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );

            expect(stale).toEqual([]);
            expect(duplicate).toEqual([]);

            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 3 }),
            );

            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(ServiceClient, client.id)),
            ).resolves.toMatchObject({
                realmVersion: 3,
                isRealmRevoked: false,
                isRevoked: true,
            });
            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(ServiceClient, other.id)),
            ).resolves.toMatchObject({
                realmVersion: 0,
                isRealmRevoked: false,
            });
            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(ServiceClient, system.id)),
            ).resolves.toMatchObject({
                realmVersion: 0,
                isRealmRevoked: false,
            });
        });
    });

    describe("purgeRealm", () => {
        it("purges only non-system clients with an older realm version", async () => {
            const client = await suite.fixtures().createServiceClient({ realm: REALM_ID });
            const current = await suite.fixtures().createServiceClient({ realm: REALM_ID, realmVersion: 3 });
            const system = await suite.fixtures().createServiceClient({ realm: REALM_ID, isSystemManaged: true });
            const other = await suite.fixtures().createServiceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            const purged = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.purgeRealm({ transaction, realm: REALM_ID, version: 3 }),
            );

            expect(purged.map((entity) => entity.id)).toEqual([client.id]);
            await expect(
                suite.transaction((transaction) => transaction.count(ServiceClient, { id: client.id })),
            ).resolves.toBe(0);
            await expect(
                suite.transaction((transaction) =>
                    transaction.count(ServiceClient, { id: { $in: [current.id, system.id, other.id] } }),
                ),
            ).resolves.toBe(3);
        });
    });

    describe("revoke", () => {
        it("rejects mutations targeting a client in another realm", async () => {
            const client = await suite.fixtures().createServiceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().serviceClientService.revoke({
                        identifiers: [client.id],
                        realm: REALM_ID,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.service-client.CLIENTS_NOT_FOUND");

            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(ServiceClient, client.id)),
            ).resolves.toMatchObject({
                isRevoked: false,
            });
        });
    });
});
