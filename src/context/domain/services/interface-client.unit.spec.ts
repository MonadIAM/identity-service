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

describe("[DomainService] - InterfaceClient", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - create", () => {
        it("[case] - throws when the realm interface client limit would be exceeded", async () => {
            // Arrange
            const { service, repositories, transaction } = createContext();
            repositories.interfaceClients.wouldExceedRealmLimit.mockImplementation(() => Promise.resolve(true));

            // Act
            const result = service.create({
                transaction: transaction.entityManager,
                input: createInput(),
                realm: REALM_ID,
            });

            // Assert
            await expect(result).rejects.toThrow("services.interface-client.REALM_LIMIT_EXCEEDED");
            expect(repositories.interfaceClients.wouldExceedRealmLimit).toHaveBeenCalledWith({
                transaction: transaction.entityManager,
                realm: REALM_ID,
            });
            expect(transaction.persist).not.toHaveBeenCalled();
        });

        it("[case] - creates a public client with the authorization code and refresh token grants", async () => {
            // Arrange
            const { service, transaction } = createContext();

            // Act
            const result = await service.create({
                transaction: transaction.entityManager,
                input: createInput(),
                realm: REALM_ID,
            });

            // Assert
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

    describe("[Method] - update", () => {
        it("[case] - validates redirect uris and auth address when the patch changes them", async () => {
            // Arrange
            const client = helpers.createInterfaceClient({ id: CLIENT_ID });
            const { service, transaction } = createContext({ client });
            const urisSpy = jest.spyOn(service, "validateRedirectUris");
            const addressSpy = jest.spyOn(service, "validateAuthAddress");
            const updateSpy = jest.spyOn(client, "update");

            // Act
            await service.update({
                patch: { redirectUris: [REDIRECT_URI], authAddress: AUTH_ADDRESS },
                transaction: transaction.entityManager,
                realm: REALM_ID,
                id: CLIENT_ID,
            });

            // Assert
            expect(urisSpy).toHaveBeenCalledWith({ redirectUris: [REDIRECT_URI] });
            expect(addressSpy).toHaveBeenCalledWith({ authAddress: AUTH_ADDRESS });
            expect(updateSpy).toHaveBeenCalledWith({ redirectUris: [REDIRECT_URI], authAddress: AUTH_ADDRESS });
        });

        it("[case] - skips both validators when the patch touches neither field", async () => {
            // Arrange
            const client = helpers.createInterfaceClient({ id: CLIENT_ID });
            const { service, repositories, transaction } = createContext({ client });
            const urisSpy = jest.spyOn(service, "validateRedirectUris");
            const addressSpy = jest.spyOn(service, "validateAuthAddress");
            const updateSpy = jest.spyOn(client, "update");

            // Act
            await service.update({
                transaction: transaction.entityManager,
                patch: { name: "Renamed Console" },
                realm: REALM_ID,
                id: CLIENT_ID,
            });

            // Assert
            expect(repositories.interfaceClients.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: CLIENT_ID, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(urisSpy).not.toHaveBeenCalled();
            expect(addressSpy).not.toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledWith({ name: "Renamed Console" });
        });
    });

    describe("[Behavior] - revocation", () => {
        it.each([
            { method: "revoke", isRevoked: false, identifiers: [CLIENT_ID], scenario: "single identifier" },
            { method: "restore", isRevoked: true, identifiers: [CLIENT_ID], scenario: "single identifier" },
            { method: "revoke", isRevoked: false, identifiers: [CLIENT_ID, CLIENT_ID], scenario: "duplicate identifiers" },
            { method: "restore", isRevoked: true, identifiers: [CLIENT_ID, CLIENT_ID], scenario: "duplicate identifiers" },
        ] as const)("[case] - $method handles $scenario once", async ({ method, isRevoked, identifiers }) => {
            // Arrange
            const client = helpers.createInterfaceClient({ id: CLIENT_ID, isRevoked });
            const { service, repositories, transaction } = createContext({ client });
            const operationSpy = jest.spyOn(client, method);

            // Act
            const result = await service[method]({
                transaction: transaction.entityManager,
                identifiers: [...identifiers],
                realm: REALM_ID,
            });

            // Assert
            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { id: { $in: [CLIENT_ID] }, realm: REALM_ID },
                transaction: transaction.entityManager,
            });
            expect(operationSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual([client]);
        });
    });

    describe("[Method] - purge", () => {
        it.each([
            { scenario: "single identifier", identifiers: [CLIENT_ID] },
            { scenario: "duplicate identifiers", identifiers: [CLIENT_ID, CLIENT_ID] },
        ])("[case] - checks eligibility and purges $scenario once", async ({ identifiers }) => {
            // Arrange
            const client = helpers.createInterfaceClient({ id: CLIENT_ID, isRevoked: true });
            const { service, transaction } = createContext({ client });
            const canPurgeSpy = jest.spyOn(client, "canPurge");

            // Act
            const result = await service.purge({
                transaction: transaction.entityManager,
                identifiers: [...identifiers],
                realm: REALM_ID,
            });

            // Assert
            expect(canPurgeSpy).toHaveBeenCalledTimes(1);
            expect(transaction.remove).toHaveBeenCalledWith(client);
            expect(result).toEqual([client]);
        });
    });

    describe("[Method] - validateRedirectUris", () => {
        it("[case] - throws when the list is empty", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateRedirectUris({ redirectUris: [] });

            // Assert
            expect(act).toThrow("services.interface-client.REDIRECT_URI_REQUIRED");
        });

        it("[case] - throws when the list is longer than the configured limit", () => {
            // Arrange
            const { service } = createContext({ redirectUriLimit: 1 });

            // Act
            const act = (): unknown =>
                service.validateRedirectUris({
                    redirectUris: [REDIRECT_URI, "https://app.example.com/second"],
                });

            // Assert
            expect(act).toThrow("services.interface-client.REDIRECT_URI_LIMIT_EXCEEDED");
        });

        it("[case] - throws when the list contains duplicates", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateRedirectUris({ redirectUris: [REDIRECT_URI, REDIRECT_URI] });

            // Assert
            expect(act).toThrow("services.interface-client.REDIRECT_URI_DUPLICATED");
        });

        it("[case] - validates every uri in the list", () => {
            // Arrange
            const { service } = createContext();
            const singleSpy = jest.spyOn(service, "validateRedirectUri");

            // Act
            service.validateRedirectUris({ redirectUris: [REDIRECT_URI, "https://app.example.com/second"] });

            // Assert
            expect(singleSpy).toHaveBeenNthCalledWith(1, { redirectUri: REDIRECT_URI });
            expect(singleSpy).toHaveBeenNthCalledWith(2, { redirectUri: "https://app.example.com/second" });
        });
    });

    describe("[Method] - validateRedirectUri", () => {
        it("[case] - throws when the uri is empty", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateRedirectUri({ redirectUri: "" });

            // Assert
            expect(act).toThrow("services.interface-client.REDIRECT_URI_REQUIRED");
        });

        it("[case] - throws when the uri carries a fragment", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateRedirectUri({ redirectUri: `${REDIRECT_URI}#token` });

            // Assert
            expect(act).toThrow("services.interface-client.REDIRECT_URI_FRAGMENT_NOT_ALLOWED");
        });

        it("[case] - throws when the uri cannot be parsed", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateRedirectUri({ redirectUri: "not-a-uri" });

            // Assert
            expect(act).toThrow("services.interface-client.INVALID_REDIRECT_URI");
        });
    });

    describe("[Method] - validateAuthAddress", () => {
        it("[case] - throws when the address is empty", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateAuthAddress({ authAddress: "" });

            // Assert
            expect(act).toThrow("services.interface-client.AUTH_ADDRESS_REQUIRED");
        });

        it("[case] - throws when the address cannot be parsed", () => {
            // Arrange
            const { service } = createContext();

            // Act
            const act = (): unknown => service.validateAuthAddress({ authAddress: "not-a-url" });

            // Assert
            expect(act).toThrow("services.interface-client.INVALID_AUTH_ADDRESS");
        });
    });

    describe("[Method] - applyRealmRevocation", () => {
        it("[case] - applies the realm version without changing a manual client revocation", async () => {
            // Arrange
            const client = helpers.createInterfaceClient({
                realmVersion: 2,
                isRealmRevoked: false,
                isRevoked: true,
                realm: REALM_ID,
            });
            const { service, repositories, transaction } = createContext({ client });

            // Act
            const result = await service.applyRealmRevocation({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            // Assert
            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(client).toMatchObject({ realmVersion: 3, isRealmRevoked: true, isRevoked: true });
            expect(result).toEqual([client]);
        });
    });

    describe("[Method] - applyRealmRestore", () => {
        it("[case] - applies the realm version without changing a manual client revocation", async () => {
            // Arrange
            const client = helpers.createInterfaceClient({
                realmVersion: 2,
                isRealmRevoked: true,
                isRevoked: true,
                realm: REALM_ID,
            });
            const { service, repositories, transaction } = createContext({ client });

            // Act
            const result = await service.applyRealmRestore({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            // Assert
            expect(repositories.interfaceClients.find).toHaveBeenCalledWith({
                where: { realm: REALM_ID, realmVersion: { $lt: 3 }, isSystemManaged: false },
                transaction: transaction.entityManager,
            });
            expect(client).toMatchObject({ realmVersion: 3, isRealmRevoked: false, isRevoked: true });
            expect(result).toEqual([client]);
        });
    });

    describe("[Method] - purgeRealm", () => {
        it("[case] - removes affected clients without requiring an individual revocation", async () => {
            // Arrange
            const client = helpers.createInterfaceClient({ realm: REALM_ID, realmVersion: 2 });
            const { service, repositories, transaction } = createContext({ client });
            const canPurge = jest.spyOn(client, "canPurge");

            // Act
            const result = await service.purgeRealm({
                transaction: transaction.entityManager,
                realm: REALM_ID,
                version: 3,
            });

            // Assert
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
