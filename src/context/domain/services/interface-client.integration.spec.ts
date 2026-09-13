import { describe, expect, it } from "@jest/globals";

import { InterfaceClientIntegrationHelpers } from "~testing/integration/domain-service/interface-client.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { InterfaceClient } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";

const REALM_ID = "00000000-0000-4000-8000-000000000031";

const helpers = new InterfaceClientIntegrationHelpers();

async function loadClients(
    suite: Integration.Domain.InterfaceClient.Suite,
    application: Entities.Application,
): Promise<Entities.InterfaceClient[]> {
    return await suite.transaction((transaction) =>
        transaction.find(InterfaceClient, { application: application.id }, { orderBy: { name: "asc" } }),
    );
}

describe("InterfaceClientService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates interface clients with fixed grant types and repository-backed limits", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Interface App" });

        const created = await suite.transaction((transaction) =>
            suite.repository().interfaceClientService.create({
                input: {
                    redirectUris: ["https://client.example.test/callback"],
                    authAddress: "https://client.example.test/auth",
                    application: application.id,
                    name: "Browser Client",
                },
                realm: REALM_ID,
                transaction,
            }),
        );
        await suite.fixtures().createInterfaceClient({
            application,
            name: "Existing Browser",
        });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().interfaceClientService.create({
                    input: {
                        redirectUris: ["https://blocked.example.test/callback"],
                        authAddress: "https://blocked.example.test/auth",
                        application: application.id,
                        name: "Blocked Browser",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.interface-client.APPLICATION_LIMIT_EXCEEDED");

        await expect(loadClients(suite, application)).resolves.toHaveLength(2);
        expect(created.grantTypes).toEqual([TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN]);
    });

    it("updates, revokes, restores and purges only clients scoped to the requested realm", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Interface App" });
        const client = await suite.fixtures().createInterfaceClient({ application, name: "Browser" });

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

        let clients = await loadClients(suite, application);

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

        clients = await loadClients(suite, application);

        expect(clients[0]?.isRevoked).toBe(true);

        await suite.transaction((transaction) =>
            suite.repository().interfaceClientService.restore({
                identifiers: [client.id],
                realm: REALM_ID,
                transaction,
            }),
        );

        clients = await loadClients(suite, application);

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

        await expect(loadClients(suite, application)).resolves.toHaveLength(0);
    });

    it("validates redirect and auth addresses before persisting rows", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Validation App" });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().interfaceClientService.create({
                    input: {
                        redirectUris: ["https://client.example.test/callback#fragment"],
                        authAddress: "https://client.example.test/auth",
                        application: application.id,
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
                        application: application.id,
                        name: "Invalid Auth",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.interface-client.INVALID_AUTH_ADDRESS");

        await expect(loadClients(suite, application)).resolves.toHaveLength(0);
    });
});
