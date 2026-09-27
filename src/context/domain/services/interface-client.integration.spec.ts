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

describe("InterfaceClientService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("create", () => {
        it("creates interface clients with fixed grant types and repository-backed limits", async () => {
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

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().interfaceClientService.create({
                        input: {
                            redirectUris: ["https://blocked.example.test/callback"],
                            authAddress: "https://blocked.example.test/auth",
                            name: "Blocked Browser",
                        },
                        realm: REALM_ID,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.interface-client.REALM_LIMIT_EXCEEDED");

            await expect(loadClients(suite, REALM_ID)).resolves.toHaveLength(2);
            expect(created.grantTypes).toEqual([TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN]);
        });

        it("validates redirect and auth addresses before persisting rows", async () => {
            await expect(
                suite.transaction((transaction) =>
                    suite.repository().interfaceClientService.create({
                        input: {
                            redirectUris: ["https://client.example.test/callback#fragment"],
                            authAddress: "https://client.example.test/auth",
                            name: "Invalid Browser",
                        },
                        realm: REALM_ID,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.interface-client.REDIRECT_URI_FRAGMENT_NOT_ALLOWED");

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().interfaceClientService.create({
                        input: {
                            redirectUris: ["https://client.example.test/callback"],
                            authAddress: "not a url",
                            name: "Invalid Auth",
                        },
                        realm: REALM_ID,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.interface-client.INVALID_AUTH_ADDRESS");

            await expect(loadClients(suite, REALM_ID)).resolves.toHaveLength(0);
        });
    });

    describe("update / revoke / restore / purge", () => {
        it("updates, revokes, restores and purges only clients scoped to the requested realm", async () => {
            const client = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, name: "Browser" });

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

            expect(clients[0]).toMatchObject({
                redirectUris: ["https://client.example.test/callback", "https://client.example.test/logout"],
                authAddress: "https://client.example.test/new-auth",
                name: "Browser Client",
            });

            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.revoke({
                    identifiers: [client.id, client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );

            clients = await loadClients(suite, REALM_ID);

            expect(clients[0]?.isRevoked).toBe(true);

            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.restore({
                    identifiers: [client.id],
                    realm: REALM_ID,
                    transaction,
                }),
            );

            clients = await loadClients(suite, REALM_ID);

            expect(clients[0]?.isRevoked).toBe(false);

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

            await expect(loadClients(suite, REALM_ID)).resolves.toHaveLength(0);
        });
    });

    describe("applyRealmRevocation / applyRealmRestore", () => {
        it("applies only newer realm events and preserves manual revocation", async () => {
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

            expect(revoked.map((entity) => entity.id)).toEqual([client.id]);
            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(InterfaceClient, client.id)),
            ).resolves.toMatchObject({
                realmVersion: 2,
                isRealmRevoked: true,
                isRevoked: true,
            });

            const stale = await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 1 }),
            );
            const duplicate = await suite.transaction((transaction) =>
                suite
                    .repository()
                    .interfaceClientService.applyRealmRevocation({ transaction, realm: REALM_ID, version: 2 }),
            );

            expect(stale).toEqual([]);
            expect(duplicate).toEqual([]);

            await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.applyRealmRestore({ transaction, realm: REALM_ID, version: 3 }),
            );

            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(InterfaceClient, client.id)),
            ).resolves.toMatchObject({
                realmVersion: 3,
                isRealmRevoked: false,
                isRevoked: true,
            });
            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(InterfaceClient, other.id)),
            ).resolves.toMatchObject({
                realmVersion: 0,
                isRealmRevoked: false,
            });
            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(InterfaceClient, system.id)),
            ).resolves.toMatchObject({
                realmVersion: 0,
                isRealmRevoked: false,
            });
        });
    });

    describe("purgeRealm", () => {
        it("purges only non-system clients with an older realm version", async () => {
            const client = await suite.fixtures().createInterfaceClient({ realm: REALM_ID });
            const current = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, realmVersion: 3 });
            const system = await suite.fixtures().createInterfaceClient({ realm: REALM_ID, isSystemManaged: true });
            const other = await suite.fixtures().createInterfaceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            const purged = await suite.transaction((transaction) =>
                suite.repository().interfaceClientService.purgeRealm({ transaction, realm: REALM_ID, version: 3 }),
            );

            expect(purged.map((entity) => entity.id)).toEqual([client.id]);
            await expect(
                suite.transaction((transaction) => transaction.count(InterfaceClient, { id: client.id })),
            ).resolves.toBe(0);
            await expect(
                suite.transaction((transaction) =>
                    transaction.count(InterfaceClient, { id: { $in: [current.id, system.id, other.id] } }),
                ),
            ).resolves.toBe(3);
        });
    });

    describe("revoke", () => {
        it("rejects mutations targeting a client in another realm", async () => {
            const client = await suite.fixtures().createInterfaceClient({
                realm: "00000000-0000-4000-8000-000000000099",
            });

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().interfaceClientService.revoke({
                        identifiers: [client.id],
                        realm: REALM_ID,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.interface-client.CLIENTS_NOT_FOUND");

            await expect(
                suite.transaction((transaction) => transaction.findOneOrFail(InterfaceClient, client.id)),
            ).resolves.toMatchObject({
                isRevoked: false,
            });
        });
    });
});
