import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { ApplicationUnitHelpers } from "~testing/unit/domain-service/application.helpers";

/* eslint-disable prettier/prettier */
const REALM_ID              = "00000000-0000-4000-8000-600000000001";
const APPLICATION_ID        = "00000000-0000-4000-8000-600000000002";
const SECOND_APPLICATION_ID = "00000000-0000-4000-8000-600000000003";
const INTERFACE_CLIENT_ID   = "00000000-0000-4000-8000-600000000004";
const SERVICE_CLIENT_ID     = "00000000-0000-4000-8000-600000000005";
/* eslint-enable prettier/prettier */

const helpers = new ApplicationUnitHelpers();

function createApplicationWithClients(props: Partial<Entities.Application.Contract> = {}): {
    serviceClient: Entities.ServiceClient;
    interfaceClient: Entities.InterfaceClient;
    application: Entities.Application;
} {
    const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID, ...props });
    const interfaceClient = helpers.createInterfaceClient({ id: INTERFACE_CLIENT_ID, application });
    const serviceClient = helpers.createServiceClient({ id: SERVICE_CLIENT_ID, application });

    application.interfaceClients = helpers.collection({ owner: application, items: [interfaceClient] });
    application.serviceClients = helpers.collection({ owner: application, items: [serviceClient] });

    return { application, interfaceClient, serviceClient };
}

describe("ApplicationService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the realm application limit would be exceeded", async () => {
            const { service, repositories, transaction } = helpers.service();
            repositories.applications.wouldExceedRealmLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { realm: REALM_ID, name: "New Application" },
                    transaction: transaction.entityManager,
                }),
            ).rejects.toThrow("services.application.REALM_LIMIT_EXCEEDED");

            expect(repositories.applications.wouldExceedRealmLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates an application in the realm and persists it", async () => {
            const { service, transaction } = helpers.service();

            const result = await service.create({
                input: { realm: REALM_ID, name: "New Application", description: "Created for tests" },
                transaction: transaction.entityManager,
            });

            expect(result).toEqual(
                expect.objectContaining({
                    description: "Created for tests",
                    name: "New Application",
                    realm: REALM_ID,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("update", () => {
        it("finds the application in the realm and applies the patch", async () => {
            const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID });
            const { service, repositories, transaction } = helpers.service({ application });
            const updateSpy = jest.spyOn(application, "update");

            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Application" },
                id: APPLICATION_ID,
                realm: REALM_ID,
            });

            expect(repositories.applications.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: APPLICATION_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ name: "Updated Application" });
        });
    });

    describe("revoke", () => {
        it("throws when not all requested applications are found", async () => {
            const { application } = createApplicationWithClients();
            const { service, repositories, transaction } = helpers.service({ application });
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            await expect(
                service.revoke({
                    identifiers: [APPLICATION_ID, SECOND_APPLICATION_ID],
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.application.APPLICATIONS_NOT_FOUND");

            expect(application.isRevoked).toBe(false);
        });

        it("revokes each application and cascades revocation to its clients", async () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients();
            const { service, repositories, transaction } = helpers.service({ application });
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRevocation");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRevocation");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.revoke({
                transaction: transaction.entityManager,
                identifiers: [APPLICATION_ID],
                realm: REALM_ID,
            });

            expect(repositories.applications.find).toHaveBeenCalledWith({
                options: { populate: ["interfaceClients", "serviceClients"] },
                where: { id: { $in: [APPLICATION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(application.isRevoked).toBe(true);
            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
            expect(result).toEqual([application]);
        });

        it("bulk identifiers: deduplicates before revoking applications and cascading to clients", async () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients();
            const { service, repositories, transaction } = helpers.service({ application });
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRevocation");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRevocation");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.revoke({
                identifiers: [APPLICATION_ID, APPLICATION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.applications.find).toHaveBeenCalledWith({
                options: { populate: ["interfaceClients", "serviceClients"] },
                where: { id: { $in: [APPLICATION_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(application.isRevoked).toBe(true);
            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
            expect(result).toEqual([application]);
        });
    });

    describe("restore", () => {
        it("throws when not all requested applications are found", async () => {
            const { application } = createApplicationWithClients({ isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ application });
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            await expect(
                service.restore({
                    identifiers: [APPLICATION_ID, SECOND_APPLICATION_ID],
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.application.APPLICATIONS_NOT_FOUND");

            expect(application.isRevoked).toBe(true);
        });

        it("restores each application and cascades restore to its clients", async () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients({ isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ application });
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRestore");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRestore");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.restore({
                transaction: transaction.entityManager,
                identifiers: [APPLICATION_ID],
                realm: REALM_ID,
            });

            expect(application.isRevoked).toBe(false);
            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
            expect(result).toEqual([application]);
        });

        it("bulk identifiers: deduplicates before restoring applications and cascading to clients", async () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients({ isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ application });
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRestore");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRestore");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.restore({
                identifiers: [APPLICATION_ID, APPLICATION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(application.isRevoked).toBe(false);
            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
            expect(result).toEqual([application]);
        });
    });

    describe("applyRealmRevocation", () => {
        it("marks every realm application as realm-revoked and cascades to clients", async () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients();
            const { service, repositories, transaction } = helpers.service({ application });
            const applySpy = jest.spyOn(application, "applyRealmRevocation");
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRevocation");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRevocation");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.applyRealmRevocation({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 2,
            });

            expect(repositories.applications.find).toHaveBeenCalledWith({
                options: { populate: ["interfaceClients", "serviceClients"] },
                transaction: transaction.entityManager,
                where: { realm: REALM_ID },
            });
            expect(applySpy).toHaveBeenCalledWith(2);
            expect(application.isRealmRevoked).toBe(true);
            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
            expect(result).toEqual([application]);
        });
    });

    describe("applyRealmRestore", () => {
        it("clears realm revocation on every realm application and cascades restore", async () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients({
                isRealmRevoked: true,
                realmVersion: 2,
            });
            const { service, repositories, transaction } = helpers.service({ application });
            const applySpy = jest.spyOn(application, "applyRealmRestore");
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRestore");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRestore");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.applyRealmRestore({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            expect(applySpy).toHaveBeenCalledWith(3);
            expect(application.isRealmRevoked).toBe(false);
            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
            expect(result).toEqual([application]);
        });
    });

    describe("purge", () => {
        it("checks purge eligibility and removes each found application", async () => {
            const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ application });
            const canPurgeSpy = jest.spyOn(application, "canPurge");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.purge({
                transaction: transaction.entityManager,
                identifiers: [APPLICATION_ID],
                realm: REALM_ID,
            });

            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenCalledWith(application);
            expect(result).toEqual([application]);
        });

        it("bulk identifiers: deduplicates before purging found applications", async () => {
            const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID, isRevoked: true });
            const { service, repositories, transaction } = helpers.service({ application });
            const canPurgeSpy = jest.spyOn(application, "canPurge");
            repositories.applications.find.mockImplementation(() => Promise.resolve([application]));

            const result = await service.purge({
                identifiers: [APPLICATION_ID, APPLICATION_ID],
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenCalledWith(application);
            expect(result).toEqual([application]);
        });
    });

    describe("purgeRealm", () => {
        it("removes only non-system applications left behind by an older realm version", async () => {
            const stale = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID, realmVersion: 1 });
            const { service, repositories, transaction } = helpers.service({ application: stale });
            repositories.applications.find.mockImplementation(() => Promise.resolve([stale]));

            await service.purgeRealm({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 2,
            });

            expect(repositories.applications.find).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                where: { realm: REALM_ID },
            });
            expect(transaction.remove).toHaveBeenCalledWith(stale);
        });

        it("keeps system-managed applications and those already at the purged realm version", async () => {
            const systemManaged = helpers.createApplication({
                id: APPLICATION_ID,
                realm: REALM_ID,
                isSystemManaged: true,
                realmVersion: 1,
            });
            const current = helpers.createApplication({
                id: SECOND_APPLICATION_ID,
                realm: REALM_ID,
                realmVersion: 2,
            });
            const { service, repositories, transaction } = helpers.service();
            repositories.applications.find.mockImplementation(() => Promise.resolve([systemManaged, current]));

            await service.purgeRealm({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 2,
            });

            expect(transaction.remove).not.toHaveBeenCalled();
        });
    });

    describe("cascadeRevocation", () => {
        it("applies application revocation to interface and service clients", () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients();
            const { service } = helpers.service({ application });
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRevocation");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRevocation");

            service.cascadeRevocation({ entities: [application] });

            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
        });
    });

    describe("cascadeRestore", () => {
        it("applies application restore to interface and service clients", () => {
            const { application, interfaceClient, serviceClient } = createApplicationWithClients();
            const { service } = helpers.service({ application });
            const interfaceSpy = jest.spyOn(interfaceClient, "applyApplicationRestore");
            const serviceSpy = jest.spyOn(serviceClient, "applyApplicationRestore");

            service.cascadeRestore({ entities: [application] });

            expect(interfaceSpy).toHaveBeenCalledWith(application.version);
            expect(serviceSpy).toHaveBeenCalledWith(application.version);
        });
    });
});
