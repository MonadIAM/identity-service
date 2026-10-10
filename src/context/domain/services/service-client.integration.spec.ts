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

describe("[DomainService] - ServiceClient", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates service clients while enforcing repository-backed limits", async () => {
            // Arrange

            // Act
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
            const result = suite.transaction((transaction) =>
                suite.repository().serviceClientService.create({
                    input: {
                        code: "blocked-worker",
                        name: "Blocked Worker",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await loadClients(suite, REALM_ID);

            // Assert
            await expect(result).rejects.toThrow("services.service-client.REALM_LIMIT_EXCEEDED");
            expect(result1).toHaveLength(2);
        });
    });

    describe("[Behavior] - client lifecycle", () => {
        it("[case] - updates, revokes, restores and purges only clients scoped to the requested realm", async () => {
            // Arrange
            const client = await suite.fixtures().createServiceClient({
                realm: REALM_ID,
                name: "Worker",
                code: "worker",
            });

            // Act
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
            const updated = clients[0];
            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.revoke({
                    identifiers: [client.id, client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            clients = await loadClients(suite, REALM_ID);
            const revoked = clients[0]?.isRevoked;
            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.restore({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            clients = await loadClients(suite, REALM_ID);
            const restored = clients[0]?.isRevoked;
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
            const remaining = await loadClients(suite, REALM_ID);

            // Assert
            expect(updated).toMatchObject({
                allowedAddresses: ["10.0.0.2"],
                name: "Worker Client",
            });
            expect(revoked).toBe(true);
            expect(restored).toBe(false);
            expect(remaining).toHaveLength(0);
        });
    });

    describe("[Behavior] - realm events", () => {
        it("[case] - applies only newer realm events and preserves manual revocation", async () => {
            // Arrange
            const client = await suite.fixtures().createServiceClient({ realm: REALM_ID, isRevoked: true });
            const other = await suite.fixtures().createServiceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });
            const system = await suite.fixtures().createServiceClient({ realm: REALM_ID, isSystemManaged: true });

            // Act
            const revoked = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );
            const revokedIds = revoked.map((entity) => entity.id);
            const afterRevocation = await suite.transaction((transaction) =>
                transaction.findOneOrFail(ServiceClient, client.id),
            );
            const stale = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 1 }),
            );
            const duplicate = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );

            await suite.transaction((transaction) =>
                suite.repository().serviceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 3 }),
            );
            const afterRestore = await suite.transaction((transaction) =>
                transaction.findOneOrFail(ServiceClient, client.id),
            );
            const otherClient = await suite.transaction((transaction) =>
                transaction.findOneOrFail(ServiceClient, other.id),
            );
            const systemClient = await suite.transaction((transaction) =>
                transaction.findOneOrFail(ServiceClient, system.id),
            );

            // Assert
            expect(revokedIds).toEqual([client.id]);
            expect(afterRevocation).toMatchObject({
                realmVersion: 2,
                isRealmRevoked: true,
                isRevoked: true,
            });
            expect(stale).toEqual([]);
            expect(duplicate).toEqual([]);
            expect(afterRestore).toMatchObject({
                realmVersion: 3,
                isRealmRevoked: false,
                isRevoked: true,
            });
            expect(otherClient).toMatchObject({
                realmVersion: 0,
                isRealmRevoked: false,
            });
            expect(systemClient).toMatchObject({
                realmVersion: 0,
                isRealmRevoked: false,
            });
        });
    });

    describe("[Method] - purgeRealm", () => {
        it("[case] - purges only non-system clients with an older realm version", async () => {
            // Arrange
            const client = await suite.fixtures().createServiceClient({ realm: REALM_ID });
            const current = await suite.fixtures().createServiceClient({ realm: REALM_ID, realmVersion: 3 });
            const system = await suite.fixtures().createServiceClient({ realm: REALM_ID, isSystemManaged: true });
            const other = await suite.fixtures().createServiceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            // Act
            const purged = await suite.transaction((transaction) =>
                suite.repository().serviceClientService.purgeRealm({ transaction, realm: REALM_ID, version: 3 }),
            );
            const result = purged.map((entity) => entity.id);
            const result1 = await suite.transaction((transaction) => transaction.count(ServiceClient, { id: client.id }));
            const result2 = await suite.transaction((transaction) =>
                transaction.count(ServiceClient, { id: { $in: [current.id, system.id, other.id] } }),
            );

            // Assert
            expect(result).toEqual([client.id]);
            expect(result1).toBe(0);
            expect(result2).toBe(3);
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - rejects mutations targeting a client in another realm", async () => {
            // Arrange
            const client = await suite.fixtures().createServiceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().serviceClientService.revoke({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await suite.transaction((transaction) => transaction.findOneOrFail(ServiceClient, client.id));

            // Assert
            await expect(result).rejects.toThrow("services.service-client.CLIENTS_NOT_FOUND");
            expect(result1).toMatchObject({
                isRevoked: false,
            });
        });
    });
});
