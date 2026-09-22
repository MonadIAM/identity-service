import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { ServiceClientUnitHelpers } from "~testing/unit/domain-service/service-client.helpers";

/* eslint-disable prettier/prettier */
const REALM_ID         = "00000000-0000-4000-8000-700000000001";
const CLIENT_ID        = "00000000-0000-4000-8000-700000000003";
const SECOND_CLIENT_ID = "00000000-0000-4000-8000-700000000004";
/* eslint-enable prettier/prettier */

const helpers = new ServiceClientUnitHelpers();

function createContext(props: { client?: Entities.ServiceClient } = {}): Unit.Domain.ServiceClient.Service.Result {
    const context = helpers.service();

    if (props.client) {
        context.repositories.serviceClients.findUniqueOrThrow.mockImplementation(() => Promise.resolve(props.client));
        context.repositories.serviceClients.find.mockImplementation(() => Promise.resolve([props.client]));
    }

    return context;
}

describe("ServiceClientService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the realm service client limit would be exceeded", async () => {
            const { service, repositories, transaction } = createContext();
            repositories.serviceClients.wouldExceedRealmLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    input: { code: "billing.worker", name: "Billing Worker" },
                    transaction: transaction.entityManager,
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.service-client.REALM_LIMIT_EXCEEDED");

            expect(repositories.serviceClients.wouldExceedRealmLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates a service client bound to the realm and persists it", async () => {
            const { service, transaction } = createContext();

            const result = await service.create({
                input: { code: "billing.worker", name: "Billing Worker" },
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });

            expect(result).toEqual(
                expect.objectContaining({
                    name: "Billing Worker",
                    code: "billing.worker",
                    realm: REALM_ID,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("update", () => {
        it("scopes the lookup to the realm directly and applies the patch", async () => {
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
                where: { id: CLIENT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(updateSpy).toHaveBeenCalledWith({ name: "Updated Worker" });
        });
    });

    describe("revoke / restore", () => {
        it.each([
            { method: "revoke", isRevoked: false, identifiers: [CLIENT_ID], scenario: "single identifier" },
            { method: "restore", isRevoked: true, identifiers: [CLIENT_ID], scenario: "single identifier" },
            { method: "revoke", isRevoked: false, identifiers: [CLIENT_ID, CLIENT_ID], scenario: "duplicate identifiers" },
            { method: "restore", isRevoked: true, identifiers: [CLIENT_ID, CLIENT_ID], scenario: "duplicate identifiers" },
        ] as const)("$method handles $scenario once", async ({ method, isRevoked, identifiers }) => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked });
            const { service, repositories, transaction } = createContext({ client });
            const operationSpy = jest.spyOn(client, method);

            const result = await service[method]({
                transaction: transaction.entityManager,
                identifiers: [...identifiers],
                realm: REALM_ID,
            });

            expect(repositories.serviceClients.find).toHaveBeenCalledWith({
                where: { id: { $in: [CLIENT_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(operationSpy).toHaveBeenCalledTimes(1);
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

        it.each([
            { scenario: "single identifier", identifiers: [CLIENT_ID] },
            { scenario: "duplicate identifiers", identifiers: [CLIENT_ID, CLIENT_ID] },
        ])("checks eligibility and purges $scenario once", async ({ identifiers }) => {
            const client = helpers.createServiceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });
            const canPurgeSpy = jest.spyOn(client, "canPurge");

            const result = await service.purge({
                transaction: transaction.entityManager,
                identifiers: [...identifiers],
                realm: REALM_ID,
            });

            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenCalledWith(client);
            expect(result).toEqual([client]);
        });
    });

    describe("applyRealmRevocation", () => {
        it("applies the realm version without changing a manual client revocation", async () => {
            const client = helpers.createServiceClient({
                realmVersion: 2,
                isRealmRevoked: false,
                isRevoked: true,
                realm: REALM_ID,
            });
            const { service, repositories, transaction } = createContext({ client });

            const result = await service.applyRealmRevocation({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            expect(repositories.serviceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(client).toMatchObject({ realmVersion: 3, isRealmRevoked: true, isRevoked: true });
            expect(result).toEqual([client]);
        });
    });

    describe("applyRealmRestore", () => {
        it("applies the realm version without changing a manual client revocation", async () => {
            const client = helpers.createServiceClient({
                realmVersion: 2,
                isRealmRevoked: true,
                isRevoked: true,
                realm: REALM_ID,
            });
            const { service, repositories, transaction } = createContext({ client });

            const result = await service.applyRealmRestore({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            expect(repositories.serviceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(client).toMatchObject({ realmVersion: 3, isRealmRevoked: false, isRevoked: true });
            expect(result).toEqual([client]);
        });
    });

    describe("purgeRealm", () => {
        it("removes affected clients without requiring an individual revocation", async () => {
            const client = helpers.createServiceClient({ realm: REALM_ID, realmVersion: 2 });
            const { service, repositories, transaction } = createContext({ client });
            const canPurge = jest.spyOn(client, "canPurge");

            const result = await service.purgeRealm({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            expect(repositories.serviceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(canPurge).not.toHaveBeenCalled();
            expect(transaction.remove).toHaveBeenCalledWith(client);
            expect(result).toEqual([client]);
        });
    });
});
