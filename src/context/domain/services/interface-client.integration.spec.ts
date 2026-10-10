import { describe, expect, it } from "@jest/globals";

import { InterfaceClientIntegrationHelpers } from "~testing/integration/domain-service/interface-client.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { InterfaceClient } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";

const REALM_ID = "00000000-0000-4000-8000-000000000031";

const helpers = new InterfaceClientIntegrationHelpers();

async function loadClients(
    suite: Integration.Domain.InterfaceClient.Suite,
    realm: string,
): Promise<Entities.InterfaceClient[]> {
    return await suite.transaction((transaction) =>
        transaction.find(InterfaceClient, { realm }, { orderBy: { name: "asc" } }),
    );
}

describe("[DomainService] - InterfaceClient", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates interface clients with fixed grant types and repository-backed limits", async () => {
            // Arrange

            // Act
            const created = await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.create({
                    input: {
                        redirectUris: ["https://client.example.test/callback"],
                        authAddress: "https://client.example.test/auth",
                        name: "Browser Client",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await suite.fixtures().createInterfaceClient({
                realm: REALM_ID,
                name: "Existing Browser",
            });
            const result = suite.transaction((transaction) =>
                suite.repository().interfaceClientService.create({
                    input: {
                        redirectUris: ["https://blocked.example.test/callback"],
                        authAddress: "https://blocked.example.test/auth",
                        name: "Blocked Browser",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await loadClients(suite, REALM_ID);

            // Assert
            await expect(result).rejects.toThrow("services.interface-client.REALM_LIMIT_EXCEEDED");
            expect(result1).toHaveLength(2);
            expect(created.grantTypes).toEqual([TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN]);
        });

        it("[case] - validates redirect and auth addresses before persisting rows", async () => {
            // Arrange

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().interfaceClientService.create({
                    input: {
                        redirectUris: ["https://client.example.test/callback#fragment"],
                        authAddress: "https://client.example.test/auth",
                        name: "Invalid Browser",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = suite.transaction((transaction) =>
                suite.repository().interfaceClientService.create({
                    input: {
                        redirectUris: ["https://client.example.test/callback"],
                        authAddress: "not a url",
                        name: "Invalid Auth",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await Promise.allSettled([result1]);
            const result2 = await loadClients(suite, REALM_ID);

            // Assert
            await expect(result).rejects.toThrow("services.interface-client.REDIRECT_URI_FRAGMENT_NOT_ALLOWED");
            await expect(result1).rejects.toThrow("services.interface-client.INVALID_AUTH_ADDRESS");
            expect(result2).toHaveLength(0);
        });
    });

    describe("[Behavior] - client lifecycle", () => {
        it("[case] - updates, revokes, restores and purges only clients scoped to the requested realm", async () => {
            // Arrange
            const client = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, name: "Browser" });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.update({
                    patch: {
                        redirectUris: ["https://client.example.test/callback", "https://client.example.test/logout"],
                        authAddress: "https://client.example.test/new-auth",
                        name: "Browser Client",
                    },
                    id: client.id,
                    realm: REALM_ID,
                    transaction,
                }),
            );
            let clients = await loadClients(suite, REALM_ID);
            const updated = clients[0];
            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.revoke({
                    identifiers: [client.id, client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            clients = await loadClients(suite, REALM_ID);
            const revoked = clients[0]?.isRevoked;
            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.restore({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            clients = await loadClients(suite, REALM_ID);
            const restored = clients[0]?.isRevoked;
            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.revoke({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.purge({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            const remaining = await loadClients(suite, REALM_ID);

            // Assert
            expect(updated).toMatchObject({
                redirectUris: ["https://client.example.test/callback", "https://client.example.test/logout"],
                authAddress: "https://client.example.test/new-auth",
                name: "Browser Client",
            });
            expect(revoked).toBe(true);
            expect(restored).toBe(false);
            expect(remaining).toHaveLength(0);
        });
    });

    describe("[Behavior] - realm events", () => {
        it("[case] - applies only newer realm events and preserves manual revocation", async () => {
            // Arrange
            const client = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, isRevoked: true });
            const other = await suite.fixtures().createInterfaceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });
            const system = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, isSystemManaged: true });
            const revoked = await suite.transaction((transaction) =>
                suite
                    .repository()
                    .interfaceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );
            const revokedIds = revoked.map((entity) => entity.id);
            const afterRevocation = await suite.transaction((transaction) =>
                transaction.findOneOrFail(InterfaceClient, client.id),
            );

            // Act
            const stale = await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 1 }),
            );
            const duplicate = await suite.transaction((transaction) =>
                suite
                    .repository()
                    .interfaceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );

            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 3 }),
            );
            const afterRestore = await suite.transaction((transaction) =>
                transaction.findOneOrFail(InterfaceClient, client.id),
            );
            const otherClient = await suite.transaction((transaction) =>
                transaction.findOneOrFail(InterfaceClient, other.id),
            );
            const systemClient = await suite.transaction((transaction) =>
                transaction.findOneOrFail(InterfaceClient, system.id),
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
            const client = await suite.fixtures().createInterfaceClient({ realm: REALM_ID });
            const current = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, realmVersion: 3 });
            const system = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, isSystemManaged: true });
            const other = await suite.fixtures().createInterfaceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            // Act
            const purged = await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.purgeRealm({ transaction, realm: REALM_ID, version: 3 }),
            );
            const result = purged.map((entity) => entity.id);
            const result1 = await suite.transaction((transaction) => transaction.count(InterfaceClient, { id: client.id }));
            const result2 = await suite.transaction((transaction) =>
                transaction.count(InterfaceClient, { id: { $in: [current.id, system.id, other.id] } }),
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
            const client = await suite.fixtures().createInterfaceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().interfaceClientService.revoke({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result1 = await suite.transaction((transaction) => transaction.findOneOrFail(InterfaceClient, client.id));

            // Assert
            await expect(result).rejects.toThrow("services.interface-client.CLIENTS_NOT_FOUND");
            expect(result1).toMatchObject({
                isRevoked: false,
            });
        });
    });
});
