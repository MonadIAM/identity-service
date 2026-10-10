import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { ServiceClient } from "./service-client.entity";

function createServiceClient(overrides?: Partial<Entities.ServiceClient.ConstructorProps>): ServiceClient {
    return new ServiceClient({
        code: "billing-worker",
        name: "Billing Worker",
        realm: "00000000-0000-4000-8000-000000000001",
        ...overrides,
    });
}

describe("[Entity] - ServiceClient", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const realm = "00000000-0000-4000-8000-000000000001";

            // Act
            const client = createServiceClient({
                code: "reporting-worker",
                name: "Reporting Worker",
                realm,
            });

            // Assert
            expect(client.code).toBe("reporting-worker");
            expect(client.name).toBe("Reporting Worker");
            expect(client.realm).toBe(realm);
        });

        it("[case] - defaults booleans to false", () => {
            // Arrange

            // Act
            const client = createServiceClient();

            // Assert
            expect(client.isSystemManaged).toBe(false);
            expect(client.isRealmRevoked).toBe(false);
            expect(client.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const client = createServiceClient({
                isSystemManaged: true,
                isRealmRevoked: true,
                isRevoked: true,
            });

            // Assert
            expect(client.isSystemManaged).toBe(true);
            expect(client.isRealmRevoked).toBe(true);
            expect(client.isRevoked).toBe(true);
        });

        it("[case] - defaults realmVersion to 0", () => {
            // Arrange

            // Act
            const client = createServiceClient();

            // Assert
            expect(client.realmVersion).toBe(0);
        });

        it("[case] - respects explicit realmVersion", () => {
            // Arrange

            // Act
            const client = createServiceClient({ realmVersion: 5 });

            // Assert
            expect(client.realmVersion).toBe(5);
        });

        it("[case] - auto-generates id, createdAt, version", () => {
            // Arrange

            // Act
            const client = createServiceClient();
            const result = isUUID(client.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(client.createdAt).toBeInstanceOf(Date);
            expect(client.version).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });

        it("[case] - assigns description when provided", () => {
            // Arrange

            // Act
            const client = createServiceClient({ description: "Internal worker" });

            // Assert
            expect(client.description).toBe("Internal worker");
        });

        it("[case] - leaves description undefined when omitted", () => {
            // Arrange

            // Act
            const client = createServiceClient();

            // Assert
            expect(client.description).toBeUndefined();
        });

        it("[case] - defaults allowedAddresses to an empty array", () => {
            // Arrange

            // Act
            const client = createServiceClient();

            // Assert
            expect(client.allowedAddresses).toEqual([]);
        });

        it("[case] - respects explicit allowedAddresses", () => {
            // Arrange

            // Act
            const client = createServiceClient({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

            // Assert
            expect(client.allowedAddresses).toEqual(["10.0.0.1", "10.0.0.2"]);
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const client = createServiceClient({ name: "Old" });

            // Act
            client.update({ name: "New" });

            // Assert
            expect(client.name).toBe("New");
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const client = createServiceClient({ name: "Old", description: "Old desc" });

            // Act
            client.update({ name: "New", description: "New desc" });

            // Assert
            expect(client.name).toBe("New");
            expect(client.description).toBe("New desc");
        });

        it("[case] - skips unchanged fields", () => {
            // Arrange
            const client = createServiceClient({ name: "Same", description: "Old" });

            // Act
            client.update({ name: "Same", description: "New" });

            // Assert
            expect(client.name).toBe("Same");
            expect(client.description).toBe("New");
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const client = createServiceClient({ name: "Original" });

            // Act
            client.update({ name: "Updated", description: undefined });

            // Assert
            expect(client.name).toBe("Updated");
            expect(client.description).toBeUndefined();
        });

        it("[case] - throws when patch is empty object", () => {
            // Arrange
            const client = createServiceClient();

            // Act
            const act = (): unknown => client.update({});

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws when no values actually changed", () => {
            // Arrange
            const client = createServiceClient({ name: "Same" });

            // Act
            const act = (): unknown => client.update({ name: "Same" });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });

        it("[case] - throws when system-managed", () => {
            // Arrange
            const client = createServiceClient({ isSystemManaged: true });

            // Act
            const act = (): unknown => client.update({ name: "New" });

            // Assert
            expect(act).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("[case] - throws when revoked", () => {
            // Arrange
            const client = createServiceClient({ isRevoked: true });

            // Act
            const act = (): unknown => client.update({ name: "New" });

            // Assert
            expect(act).toThrow("CANNOT_UPDATE_REVOKED");
        });
    });
    describe("[Behavior] - update allowedAddresses change detection", () => {
        it("[case] - detects a change when array length differs", () => {
            // Arrange
            const client = createServiceClient({ allowedAddresses: ["10.0.0.1"] });

            // Act
            client.update({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

            // Assert
            expect(client.allowedAddresses).toEqual(["10.0.0.1", "10.0.0.2"]);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - detects a change when elements differ at the same length", () => {
            // Arrange
            const client = createServiceClient({ allowedAddresses: ["10.0.0.1"] });

            // Act
            client.update({ allowedAddresses: ["10.0.0.2"] });

            // Assert
            expect(client.allowedAddresses).toEqual(["10.0.0.2"]);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - treats an identical array as unchanged", () => {
            // Arrange
            const client = createServiceClient({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

            // Act
            const act = (): unknown => client.update({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
            expect(client.updatedAt).toBeUndefined();
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active client", () => {
            // Arrange
            const client = createServiceClient();

            // Act
            client.revoke();

            // Assert
            expect(client.isRevoked).toBe(true);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const client = createServiceClient({ isRevoked: true });

            // Act
            const act = (): unknown => client.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });

        it("[case] - throws when system-managed", () => {
            // Arrange
            const client = createServiceClient({ isSystemManaged: true });

            // Act
            const act = (): unknown => client.revoke();

            // Assert
            expect(act).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked client", () => {
            // Arrange
            const client = createServiceClient({ isRevoked: true });

            // Act
            client.restore();

            // Assert
            expect(client.isRevoked).toBe(false);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const client = createServiceClient();

            // Act
            const act = (): unknown => client.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });

        it("[case] - throws when system-managed", () => {
            // Arrange
            const client = createServiceClient({ isSystemManaged: true });

            // Act
            const act = (): unknown => client.restore();

            // Assert
            expect(act).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active client", () => {
            // Arrange
            const client = createServiceClient();

            // Act
            const act = (): unknown => client.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws for system-managed client regardless of revoked state", () => {
            // Arrange
            const client = createServiceClient({ isSystemManaged: true, isRevoked: true });

            // Act
            const act = (): unknown => client.canPurge();

            // Assert
            expect(act).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("[case] - passs for revoked non-system client", () => {
            // Arrange
            const client = createServiceClient({ isRevoked: true });

            // Act
            const act = (): unknown => client.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });

    describe("[Method] - applyRealmRevocation", () => {
        it("[case] - marks as realm-revoked and bump realmVersion", () => {
            // Arrange
            const client = createServiceClient({ realmVersion: 1 });

            // Act
            client.applyRealmRevocation(2);

            // Assert
            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - bes a no-op when version is not greater than current", () => {
            // Arrange
            const client = createServiceClient({ realmVersion: 2 });

            // Act
            client.applyRealmRevocation(2);

            // Assert
            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("[case] - bes a no-op for system-managed clients", () => {
            // Arrange
            const client = createServiceClient({ isSystemManaged: true, realmVersion: 1 });

            // Act
            client.applyRealmRevocation(2);

            // Assert
            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });
    });

    describe("[Method] - applyRealmRestore", () => {
        it("[case] - clears realm-revoked flag and bump realmVersion", () => {
            // Arrange
            const client = createServiceClient({ realmVersion: 2, isRealmRevoked: true });

            // Act
            client.applyRealmRestore(3);

            // Assert
            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(3);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - bes a no-op when version is not greater than current", () => {
            // Arrange
            const client = createServiceClient({ realmVersion: 2, isRealmRevoked: true });

            // Act
            client.applyRealmRestore(2);

            // Assert
            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("[case] - bes a no-op for system-managed clients", () => {
            // Arrange
            const client = createServiceClient({
                isSystemManaged: true,
                isRealmRevoked: true,
                realmVersion: 1,
            });

            // Act
            client.applyRealmRestore(2);

            // Assert
            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });
    });
});
