import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { InterfaceClientUnitHelpers } from "~testing/unit/domain-service/interface-client.helpers";
import { TokenGrantType } from "~context/enums";

/* eslint-disable prettier/prettier */
const REALM_ID       = "00000000-0000-4000-8000-800000000001";
const CLIENT_ID      = "00000000-0000-4000-8000-800000000003";
/* eslint-enable prettier/prettier */

const REDIRECT_URI = "https://app.example.com/callback";
const AUTH_ADDRESS = "https://app.example.com";

const helpers = new InterfaceClientUnitHelpers();

function createContext(
    props: { redirectUriLimit?: number; client?: Entities.InterfaceClient } = {},
): Unit.Domain.InterfaceClient.Service.Result {
    const context = helpers.service({ redirectUriLimit: props.redirectUriLimit });

    if (props.client) {
        context.repositories.interfaceClients.findUniqueOrThrow.mockImplementation(() => Promise.resolve(props.client));
        context.repositories.interfaceClients.find.mockImplementation(() => Promise.resolve([props.client]));
    }

    return context;
}

function createInput(
    overrides: Partial<Services.InterfaceClient.Create.Props["input"]> = {},
): Services.InterfaceClient.Create.Props["input"] {
    return {
        redirectUris: [REDIRECT_URI],
        authAddress: AUTH_ADDRESS,
        name: "Web Console",
        ...overrides,
    };
}

describe("InterfaceClientService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("throws when the realm interface client limit would be exceeded", async () => {
            const { service, repositories, transaction } = createContext();
            repositories.interfaceClients.wouldExceedRealmLimit.mockImplementation(() => Promise.resolve(true));

            await expect(
                service.create({
                    transaction: transaction.entityManager,
                    input: createInput(),
                    realm: REALM_ID,
                }),
            ).rejects.toThrow("services.interface-client.REALM_LIMIT_EXCEEDED");

            expect(repositories.interfaceClients.wouldExceedRealmLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("creates a public client with the authorization code and refresh token grants", async () => {
            const { service, transaction } = createContext();

            const result = await service.create({
                transaction: transaction.entityManager,
                input: createInput(),
                realm: REALM_ID,
            });

            expect(result).toEqual(
                expect.objectContaining({
                    grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                    redirectUris: [REDIRECT_URI],
                    authAddress: AUTH_ADDRESS,
                    name: "Web Console",
                    realm: REALM_ID,
                }),
            );
            expect(transaction.persist).toHaveBeenCalledWith(result);
        });
    });

    describe("update", () => {
        it("validates redirect uris and auth address when the patch changes them", async () => {
            const client = helpers.createInterfaceClient({ id: CLIENT_ID });
            const { service, transaction } = createContext({ client });
            const urisSpy = jest.spyOn(service, "validateRedirectUris");
            const addressSpy = jest.spyOn(service, "validateAuthAddress");
            const updateSpy = jest.spyOn(client, "update");

            await service.update({
                patch: { redirectUris: [REDIRECT_URI], authAddress: AUTH_ADDRESS },
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: CLIENT_ID,
            });

            expect(urisSpy).toHaveBeenCalledWith({ redirectUris: [REDIRECT_URI] });
            expect(addressSpy).toHaveBeenCalledWith({ authAddress: AUTH_ADDRESS });
            expect(updateSpy).toHaveBeenCalledWith({ redirectUris: [REDIRECT_URI], authAddress: AUTH_ADDRESS });
        });

        it("skips both validators when the patch touches neither field", async () => {
            const client = helpers.createInterfaceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const urisSpy = jest.spyOn(service, "validateRedirectUris");
            const addressSpy = jest.spyOn(service, "validateAuthAddress");
            const updateSpy = jest.spyOn(client, "update");

            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Renamed Console" },
                realm: REALM_ID,
                id: CLIENT_ID,
            });

            expect(repositories.interfaceClients.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: CLIENT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(urisSpy).not.toHaveBeenCalled();
            expect(addressSpy).not.toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledWith({ name: "Renamed Console" });
        });
    });

    describe("revoke", () => {
        it("revokes found clients and returns them", async () => {
            const client = helpers.createInterfaceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const revokeSpy = jest.spyOn(client, "revoke");

            const result = await service.revoke({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID],
                realm: REALM_ID,
            });

            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { id: { $in: [CLIENT_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(revokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });

        it("bulk identifiers: deduplicates before revoking found clients", async () => {
            const client = helpers.createInterfaceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const revokeSpy = jest.spyOn(client, "revoke");

            const result = await service.revoke({
                transaction: transaction.entityManager,
                identifiers: [CLIENT_ID, CLIENT_ID],
                realm: REALM_ID,
            });

            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { id: { $in: [CLIENT_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(revokeSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });
    });

    describe("restore", () => {
        it("restores found clients and returns them", async () => {
            const client = helpers.createInterfaceClient({ id: CLIENT_ID, isRevoked: true });
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
            const client = helpers.createInterfaceClient({ id: CLIENT_ID, isRevoked: true });
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
        it("checks purge eligibility and removes found clients", async () => {
            const client = helpers.createInterfaceClient({ id: CLIENT_ID, isRevoked: true });
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
            const client = helpers.createInterfaceClient({ id: CLIENT_ID, isRevoked: true });
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

    describe("validateRedirectUris", () => {
        it("throws when the list is empty", () => {
            const { service } = createContext();

            expect(() => service.validateRedirectUris({ redirectUris: [] })).toThrow(
                "services.interface-client.REDIRECT_URI_REQUIRED",
            );
        });

        it("throws when the list is longer than the configured limit", () => {
            const { service } = createContext({ redirectUriLimit: 1 });

            expect(() =>
                service.validateRedirectUris({
                    redirectUris: [REDIRECT_URI, "https://app.example.com/second"],
                }),
            ).toThrow("services.interface-client.REDIRECT_URI_LIMIT_EXCEEDED");
        });

        it("throws when the list contains duplicates", () => {
            const { service } = createContext();

            expect(() => service.validateRedirectUris({ redirectUris: [REDIRECT_URI, REDIRECT_URI] })).toThrow(
                "services.interface-client.REDIRECT_URI_DUPLICATED",
            );
        });

        it("validates every uri in the list", () => {
            const { service } = createContext();
            const singleSpy = jest.spyOn(service, "validateRedirectUri");

            service.validateRedirectUris({ redirectUris: [REDIRECT_URI, "https://app.example.com/second"] });

            expect(singleSpy).toHaveBeenNthCalledWith(1, { redirectUri: REDIRECT_URI });
            expect(singleSpy).toHaveBeenNthCalledWith(2, { redirectUri: "https://app.example.com/second" });
        });
    });

    describe("validateRedirectUri", () => {
        it("throws when the uri is empty", () => {
            const { service } = createContext();

            expect(() => service.validateRedirectUri({ redirectUri: "" })).toThrow(
                "services.interface-client.REDIRECT_URI_REQUIRED",
            );
        });

        it("throws when the uri carries a fragment", () => {
            const { service } = createContext();

            expect(() => service.validateRedirectUri({ redirectUri: `${REDIRECT_URI}#token` })).toThrow(
                "services.interface-client.REDIRECT_URI_FRAGMENT_NOT_ALLOWED",
            );
        });

        it("throws when the uri cannot be parsed", () => {
            const { service } = createContext();

            expect(() => service.validateRedirectUri({ redirectUri: "not-a-uri" })).toThrow(
                "services.interface-client.INVALID_REDIRECT_URI",
            );
        });
    });

    describe("validateAuthAddress", () => {
        it("throws when the address is empty", () => {
            const { service } = createContext();

            expect(() => service.validateAuthAddress({ authAddress: "" })).toThrow(
                "services.interface-client.AUTH_ADDRESS_REQUIRED",
            );
        });

        it("throws when the address cannot be parsed", () => {
            const { service } = createContext();

            expect(() => service.validateAuthAddress({ authAddress: "not-a-url" })).toThrow(
                "services.interface-client.INVALID_AUTH_ADDRESS",
            );
        });
    });
    describe("applyRealmRevocation", () => {
        it("applies the realm version without changing a manual client revocation", async () => {
            const client = helpers.createInterfaceClient({
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

            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(client).toMatchObject({ realmVersion: 3, isRealmRevoked: true, isRevoked: true });
            expect(result).toEqual([client]);
        });
    });

    describe("applyRealmRestore", () => {
        it("applies the realm version without changing a manual client revocation", async () => {
            const client = helpers.createInterfaceClient({
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

            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(client).toMatchObject({ realmVersion: 3, isRealmRevoked: false, isRevoked: true });
            expect(result).toEqual([client]);
        });
    });

    describe("purgeRealm", () => {
        it("removes affected clients without requiring an individual revocation", async () => {
            const client = helpers.createInterfaceClient({ realm: REALM_ID, realmVersion: 2 });
            const { service, repositories, transaction } = createContext({ client });
            const canPurge = jest.spyOn(client, "canPurge");

            const result = await service.purgeRealm({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(canPurge).not.toHaveBeenCalled();
            expect(transaction.remove).toHaveBeenCalledWith(client);
            expect(result).toEqual([client]);
        });
    });
});
