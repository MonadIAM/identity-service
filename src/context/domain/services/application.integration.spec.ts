import { describe, expect, it } from "@jest/globals";

import { ApplicationIntegrationHelpers } from "~testing/integration/domain-service/application.helpers";
import { Application, InterfaceClient, ServiceClient } from "~context/domain/entities";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";

const REALM_ID = "00000000-0000-4000-8000-000000000011";
const OTHER_REALM_ID = "00000000-0000-4000-8000-000000000012";

const helpers = new ApplicationIntegrationHelpers();

async function loadApplications(
    suite: Integration.Domain.Application.Suite,
    realm: string,
): Promise<Entities.Application[]> {
    return await suite.transaction((transaction) => transaction.find(Application, { realm }, { orderBy: { name: "asc" } }));
}

async function loadInterfaceClients(
    suite: Integration.Domain.Application.Suite,
    application: Entities.Application,
): Promise<Entities.InterfaceClient[]> {
    return await suite.transaction((transaction) =>
        transaction.find(InterfaceClient, { application: application.id }, { orderBy: { name: "asc" } }),
    );
}

async function loadServiceClients(
    suite: Integration.Domain.Application.Suite,
    application: Entities.Application,
): Promise<Entities.ServiceClient[]> {
    return await suite.transaction((transaction) =>
        transaction.find(ServiceClient, { application: application.id }, { orderBy: { name: "asc" } }),
    );
}

describe("ApplicationService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates applications while enforcing repository-backed realm limits", async () => {
        await suite.fixtures().createApplication({ realm: REALM_ID, name: "First App" });
        await suite.fixtures().createApplication({ realm: REALM_ID, name: "Revoked App", isRevoked: true });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().applicationService.create({
                    input: {
                        name: "Blocked App",
                        realm: REALM_ID,
                    },
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.application.REALM_LIMIT_EXCEEDED");

        await suite.transaction((transaction) =>
            suite.repository().applicationService.create({
                input: {
                    name: "Other Realm App",
                    realm: OTHER_REALM_ID,
                },
                transaction,
            }),
        );

        await expect(loadApplications(suite, REALM_ID)).resolves.toHaveLength(2);
        await expect(loadApplications(suite, OTHER_REALM_ID)).resolves.toHaveLength(1);
    });

    it("rejects application updates outside the requested realm", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Scoped App" });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().applicationService.update({
                    patch: {
                        name: "Wrong Realm Name",
                    },
                    id: application.id,
                    realm: OTHER_REALM_ID,
                    transaction,
                }),
            ),
        ).rejects.toThrow("db.NOT_FOUND");
    });

    it("updates applications scoped to the requested realm", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Scoped App" });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.update({
                patch: {
                    name: "Renamed App",
                },
                id: application.id,
                realm: REALM_ID,
                transaction,
            }),
        );

        const applications = await loadApplications(suite, REALM_ID);

        expect(applications[0]?.name).toBe("Renamed App");
        expect(applications[0]?.updatedAt).toBeInstanceOf(Date);
    });

    it("cascades application revocation to both client types", async () => {
        const application = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Cascade App" });
        const interfaceClient = await suite.fixtures().createInterfaceClient({ application, name: "Browser" });
        const serviceClient = await suite.fixtures().createServiceClient({
            application,
            name: "Worker",
            code: "worker",
        });
        const systemInterface = await suite.fixtures().createInterfaceClient({
            application,
            name: "System Browser",
            isSystemManaged: true,
        });
        const systemService = await suite.fixtures().createServiceClient({
            application,
            name: "System Worker",
            code: "system-worker",
            isSystemManaged: true,
        });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.revoke({
                identifiers: [application.id, application.id],
                realm: REALM_ID,
                transaction,
            }),
        );

        const applications = await loadApplications(suite, REALM_ID);
        const interfaceClients = await loadInterfaceClients(suite, application);
        const serviceClients = await loadServiceClients(suite, application);

        expect(applications[0]?.isRevoked).toBe(true);
        expect(interfaceClients.find(({ id }) => id === interfaceClient.id)?.isApplicationRevoked).toBe(true);
        expect(serviceClients.find(({ id }) => id === serviceClient.id)?.isApplicationRevoked).toBe(true);
        expect(interfaceClients.find(({ id }) => id === systemInterface.id)?.isApplicationRevoked).toBe(false);
        expect(serviceClients.find(({ id }) => id === systemService.id)?.isApplicationRevoked).toBe(false);
    });

    it("cascades application restore to both client types", async () => {
        const application = await suite.fixtures().createApplication({
            realm: REALM_ID,
            isRevoked: true,
            name: "Cascade App",
        });
        const interfaceClient = await suite.fixtures().createInterfaceClient({
            isApplicationRevoked: true,
            application,
            name: "Browser",
        });
        const serviceClient = await suite.fixtures().createServiceClient({
            isApplicationRevoked: true,
            application,
            name: "Worker",
            code: "worker",
        });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.restore({
                identifiers: [application.id],
                realm: REALM_ID,
                transaction,
            }),
        );

        const applications = await loadApplications(suite, REALM_ID);
        const interfaceClients = await loadInterfaceClients(suite, application);
        const serviceClients = await loadServiceClients(suite, application);

        expect(applications[0]?.isRevoked).toBe(false);
        expect(interfaceClients.find(({ id }) => id === interfaceClient.id)?.isApplicationRevoked).toBe(false);
        expect(serviceClients.find(({ id }) => id === serviceClient.id)?.isApplicationRevoked).toBe(false);
    });

    it("applies realm revocation only with newer versions and keeps system managed applications", async () => {
        const mutable = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Mutable App" });
        const stale = await suite.fixtures().createApplication({
            realmVersion: 10,
            realm: REALM_ID,
            name: "Stale App",
        });
        const systemManaged = await suite.fixtures().createApplication({
            isSystemManaged: true,
            realm: REALM_ID,
            name: "System App",
        });
        await suite.fixtures().createInterfaceClient({ application: mutable, name: "Browser" });
        await suite.fixtures().createServiceClient({ application: mutable, name: "Worker", code: "worker" });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.applyRealmRevocation({
                version: 5,
                realm: REALM_ID,
                transaction,
            }),
        );

        const applications = await loadApplications(suite, REALM_ID);
        const interfaceClients = await loadInterfaceClients(suite, mutable);
        const serviceClients = await loadServiceClients(suite, mutable);

        expect(applications.find(({ id }) => id === mutable.id)).toMatchObject({
            isRealmRevoked: true,
            realmVersion: 5,
        });
        expect(applications.find(({ id }) => id === stale.id)?.isRealmRevoked).toBe(false);
        expect(applications.find(({ id }) => id === systemManaged.id)?.isRealmRevoked).toBe(false);
        expect(interfaceClients[0]?.isApplicationRevoked).toBe(true);
        expect(serviceClients[0]?.isApplicationRevoked).toBe(true);
    });

    it("applies realm restore only with newer versions", async () => {
        const application = await suite.fixtures().createApplication({
            isRealmRevoked: true,
            realmVersion: 5,
            realm: REALM_ID,
            name: "Restored Realm App",
        });
        await suite.fixtures().createInterfaceClient({
            isApplicationRevoked: true,
            application,
            name: "Browser",
        });
        await suite.fixtures().createServiceClient({
            isApplicationRevoked: true,
            application,
            name: "Worker",
            code: "worker",
        });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.applyRealmRestore({
                version: 6,
                realm: REALM_ID,
                transaction,
            }),
        );

        const applications = await loadApplications(suite, REALM_ID);
        const interfaceClients = await loadInterfaceClients(suite, application);
        const serviceClients = await loadServiceClients(suite, application);

        expect(applications[0]).toMatchObject({
            isRealmRevoked: false,
            realmVersion: 6,
        });
        expect(interfaceClients[0]?.isApplicationRevoked).toBe(false);
        expect(serviceClients[0]?.isApplicationRevoked).toBe(false);
    });

    it("purges realm applications only with newer versions and keeps system managed applications", async () => {
        const mutable = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Mutable App" });
        const stale = await suite.fixtures().createApplication({
            realmVersion: 10,
            realm: REALM_ID,
            name: "Stale App",
        });
        const systemManaged = await suite.fixtures().createApplication({
            isSystemManaged: true,
            realm: REALM_ID,
            name: "System App",
        });
        await suite.fixtures().createInterfaceClient({ application: mutable, name: "Browser" });
        await suite.fixtures().createServiceClient({ application: mutable, name: "Worker", code: "worker" });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.purgeRealm({
                version: 7,
                realm: REALM_ID,
                transaction,
            }),
        );

        const applications = await loadApplications(suite, REALM_ID);
        const interfaceClients = await loadInterfaceClients(suite, mutable);
        const serviceClients = await loadServiceClients(suite, mutable);

        expect(applications.map(({ id }) => id).sort()).toEqual([stale.id, systemManaged.id].sort());
        expect(interfaceClients).toHaveLength(0);
        expect(serviceClients).toHaveLength(0);
    });

    it("rolls back active application purges", async () => {
        const active = await suite.fixtures().createApplication({ realm: REALM_ID, name: "Active App" });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().applicationService.purge({
                    identifiers: [active.id],
                    realm: REALM_ID,
                    transaction,
                }),
            ),
        ).rejects.toThrow("entities.application.CANNOT_PURGE_ACTIVE");

        await expect(loadApplications(suite, REALM_ID)).resolves.toHaveLength(1);
    });

    it("purges revoked applications with their clients", async () => {
        const revoked = await suite.fixtures().createApplication({
            realm: OTHER_REALM_ID,
            isRevoked: true,
            name: "Revoked App",
        });
        await suite.fixtures().createInterfaceClient({ application: revoked, name: "Browser" });
        await suite.fixtures().createServiceClient({ application: revoked, name: "Worker", code: "worker" });

        await suite.transaction((transaction) =>
            suite.repository().applicationService.purge({
                identifiers: [revoked.id],
                realm: OTHER_REALM_ID,
                transaction,
            }),
        );

        await expect(loadApplications(suite, OTHER_REALM_ID)).resolves.toHaveLength(0);
        await expect(loadInterfaceClients(suite, revoked)).resolves.toHaveLength(0);
        await expect(loadServiceClients(suite, revoked)).resolves.toHaveLength(0);
    });
});
