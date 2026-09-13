import { describe, expect, it } from "@jest/globals";

import { ServiceClientIntegrationHelpers } from "~testing/integration/domain-service/service-client.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { ServiceClient } from "~context/domain/entities";

const REALM_ID = "00000000-0000-4000-8000-000000000041";
const helpers = new ServiceClientIntegrationHelpers();

async function loadClients(
    suite: Integration.Domain.ServiceClient.Suite,
    application: Entities.Application,
): Promise<Entities.ServiceClient[]> {
    return await suite.transaction((transaction) =>
        transaction.find(ServiceClient, { application: application.id }, { orderBy: { name: "asc" } }),
    );
}

describe("ServiceClientService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates service clients while enforcing repository-backed limits", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Service App" });

        await suite.transaction((transaction) =>
            suite.repository().serviceClientService.create({
                input: {
                    allowedAddresses: ["10.0.0.1"],
                    application: application.id,
                    code: "worker",
                    name: "Worker",
                },
                realm: REALM_ID,
                transaction,
            }),
        );
        await suite.fixtures().createServiceClient({
            application,
            name: "Existing Worker",
            code: "existing-worker",
        });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().serviceClientService.create({
                    input: {
                        application: application.id,
                        code: "blocked-worker",
                        name: "Blocked Worker",
                    },
                    realm: REALM_ID,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.service-client.APPLICATION_LIMIT_EXCEEDED");

        await expect(loadClients(suite, application)).resolves.toHaveLength(2);
    });

    it("updates, revokes, restores and purges only clients scoped to the requested realm", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Service App" });
        const client = await suite.fixtures().createServiceClient({
            application,
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

        let clients = await loadClients(suite, application);

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

        clients = await loadClients(suite, application);

        expect(clients[0]?.isRevoked).toBe(true);

        await suite.transaction((transaction) =>
            suite.repository().serviceClientService.restore({
                identifiers: [client.id],
                realm: REALM_ID,
                transaction,
            }),
        );

        clients = await loadClients(suite, application);

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

        await expect(loadClients(suite, application)).resolves.toHaveLength(0);
    });
});
