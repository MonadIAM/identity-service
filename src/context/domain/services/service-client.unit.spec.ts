import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { ServiceClientUnitHelpers } from "~testing/unit/domain-service/service-client.helpers";

/* eslint-disable prettier/prettier */
const REALM_ID         = "00000000-0000-4000-8000-700000000001";
const APPLICATION_ID   = "00000000-0000-4000-8000-700000000002";
const CLIENT_ID        = "00000000-0000-4000-8000-700000000003";
const SECOND_CLIENT_ID = "00000000-0000-4000-8000-700000000004";
/* eslint-enable prettier/prettier */

const helpers = new ServiceClientUnitHelpers();

function createContext(
    props: { client?: Entities.ServiceClient } = {},
): Unit.Domain.ServiceClient.Service.Result & { readonly application: Entities.Application } {
    const application = helpers.createApplication({ id: APPLICATION_ID, realm: REALM_ID });
    const context = helpers.service({ application });

    if (props.client) {
        context.repositories.serviceClients.findUniqueOrThrow.mockImplementation(() => Promise.resolve(props.client));
        context.repositories.serviceClients.find.mockImplementation(() => Promise.resolve([props.client]));
    }

    return { ...context, application };
}

describe("ServiceClientService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the application service client limit would be exceeded", async () => {
            const { service, repositories, transaction, application } = createContext();
            repositories.serviceClients.wouldExceedApplicationLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { application: APPLICATION_ID, code: "billing.worker", name: "Billing Worker" },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.service-client.APPLICATION_LIMIT_EXCEEDED");

            expect(repositories.serviceClients.wouldExceedApplicationLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                application: application.id,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates a service client bound to the realm application and persists it", async () => {
            const { service, repositories, transaction, application } = createContext();

            const result = await service.create({
                input: { application: APPLICATION_ID, code: "billing.worker", name: "Billing Worker" },
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(repositories.applications.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: APPLICATION_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(result).toEqual(
                expect.objectContaining({
                    name: "Billing Worker",
                    code: "billing.worker",
                    application,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("update", () => {
        it("scopes the lookup to the realm through the application and applies the patch", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const updateSpy = jest.spyOn(client, "update");

            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Updated Worker" },
                realm: REALM_ID,
                id: CLIENT_ID,
            });

            expect(repositories.serviceClients.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: CLIENT_ID, application: { realm: REALM_ID } },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ name: "Updated Worker" });
        });
    });

    describe("revoke", () => {
        it("revokes found clients and returns them", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const revokeSpy = jest.spyOn(client, "revoke");

            const result = await service.revoke({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID],
                realm: REALM_ID,
            });

            expect(repositories.serviceClients.find).toHaveBeenCalledWith({
                where: { id: { $in: [CLIENT_ID] }, application: { realm: REALM_ID } },
                options: { populate: ["application"] },
                transaction: transaction.entityManager,
            });
            expect(revokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });

        it("bulk identifiers: deduplicates before revoking found clients", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const revokeSpy = jest.spyOn(client, "revoke");

            const result = await service.revoke({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID, CLIENT_ID],
                realm: REALM_ID,
            });

            expect(repositories.serviceClients.find).toHaveBeenCalledWith({
                where: { id: { $in: [CLIENT_ID] }, application: { realm: REALM_ID } },
                options: { populate: ["application"] },
                transaction: transaction.entityManager,
            });
            expect(revokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });
    });

    describe("restore", () => {
        it("restores found clients and returns them", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });
            const restoreSpy = jest.spyOn(client, "restore");

            const result = await service.restore({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID],
                realm: REALM_ID,
            });

            expect(restoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });

        it("bulk identifiers: deduplicates before restoring found clients", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });
            const restoreSpy = jest.spyOn(client, "restore");

            const result = await service.restore({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID, CLIENT_ID],
                realm: REALM_ID,
            });

            expect(restoreSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });
    });

    describe("purge", () => {
        it("throws when not all requested clients are found", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });

            await expect(
                service.purge({
                    identifiers: [CLIENT_ID, SECOND_CLIENT_ID],
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.service-client.CLIENTS_NOT_FOUND");

            expect(transaction.remove).not.toHaveBeenCalled();
        });

        it("checks purge eligibility and removes found clients", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });
            const canPurgeSpy = jest.spyOn(client, "canPurge");

            const result = await service.purge({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID],
                realm: REALM_ID,
            });

            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenCalledWith(client);
            expect(result).toEqual([client]);
        });

        it("bulk identifiers: deduplicates before purging found clients", async () => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });
            const canPurgeSpy = jest.spyOn(client, "canPurge");

            const result = await service.purge({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID, CLIENT_ID],
                realm: REALM_ID,
            });

            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenCalledWith(client);
            expect(result).toEqual([client]);
        });
    });
});
