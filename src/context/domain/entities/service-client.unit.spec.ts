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

describe("ServiceClient Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const realm = "00000000-0000-4000-8000-000000000001";

            const client = createServiceClient({
                code: "reporting-worker",
                name: "Reporting Worker",
                realm,
            });

            expect(client.code).toBe("reporting-worker");
            expect(client.name).toBe("Reporting Worker");
            expect(client.realm).toBe(realm);
        });

        it("should default booleans to false", () => {
            const client = createServiceClient();

            expect(client.isSystemManaged).toBe(false);
            expect(client.isRealmRevoked).toBe(false);
            expect(client.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const client = createServiceClient({
                isSystemManaged: true,
                isRealmRevoked: true,
                isRevoked: true,
            });

            expect(client.isSystemManaged).toBe(true);
            expect(client.isRealmRevoked).toBe(true);
            expect(client.isRevoked).toBe(true);
        });

        it("should default realmVersion to 0", () => {
            const client = createServiceClient();

            expect(client.realmVersion).toBe(0);
        });

        it("should respect explicit realmVersion", () => {
            const client = createServiceClient({ realmVersion: 5 });

            expect(client.realmVersion).toBe(5);
        });

        it("should auto-generate id, createdAt, version", () => {
            const client = createServiceClient();

            expect(isUUID(client.id, "4")).toBe(true);
            expect(client.createdAt).toBeInstanceOf(Date);
            expect(client.version).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const client = createServiceClient({ description: "Internal worker" });

            expect(client.description).toBe("Internal worker");
        });

        it("should leave description undefined when omitted", () => {
            const client = createServiceClient();

            expect(client.description).toBeUndefined();
        });

        it("should default allowedAddresses to an empty array", () => {
            const client = createServiceClient();

            expect(client.allowedAddresses).toEqual([]);
        });

        it("should respect explicit allowedAddresses", () => {
            const client = createServiceClient({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

            expect(client.allowedAddresses).toEqual(["10.0.0.1", "10.0.0.2"]);
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const client = createServiceClient({ name: "Old" });

            client.update({ name: "New" });

            expect(client.name).toBe("New");
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const client = createServiceClient({ name: "Old", description: "Old desc" });

            client.update({ name: "New", description: "New desc" });

            expect(client.name).toBe("New");
            expect(client.description).toBe("New desc");
        });

        it("should skip unchanged fields", () => {
            const client = createServiceClient({ name: "Same", description: "Old" });

            client.update({ name: "Same", description: "New" });

            expect(client.name).toBe("Same");
            expect(client.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const client = createServiceClient({ name: "Original" });

            client.update({ name: "Updated", description: undefined });

            expect(client.name).toBe("Updated");
            expect(client.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const client = createServiceClient();

            expect(() => client.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const client = createServiceClient({ name: "Same" });

            expect(() => client.update({ name: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });

        it("should throw when system-managed", () => {
            const client = createServiceClient({ isSystemManaged: true });

            expect(() => client.update({ name: "New" })).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should throw when revoked", () => {
            const client = createServiceClient({ isRevoked: true });

            expect(() => client.update({ name: "New" })).toThrow("CANNOT_UPDATE_REVOKED");
        });

        describe("allowedAddresses change detection", () => {
            it("should detect a change when array length differs", () => {
                const client = createServiceClient({ allowedAddresses: ["10.0.0.1"] });

                client.update({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

                expect(client.allowedAddresses).toEqual(["10.0.0.1", "10.0.0.2"]);
                expect(client.updatedAt).toBeInstanceOf(Date);
            });

            it("should detect a change when elements differ at the same length", () => {
                const client = createServiceClient({ allowedAddresses: ["10.0.0.1"] });

                client.update({ allowedAddresses: ["10.0.0.2"] });

                expect(client.allowedAddresses).toEqual(["10.0.0.2"]);
                expect(client.updatedAt).toBeInstanceOf(Date);
            });

            it("should treat an identical array as unchanged", () => {
                const client = createServiceClient({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

                expect(() => client.update({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] })).toThrow("NO_CHANGES_DETECTED");
                expect(client.updatedAt).toBeUndefined();
            });
        });
    });

    describe("revoke", () => {
        it("should revoke an active client", () => {
            const client = createServiceClient();

            client.revoke();

            expect(client.isRevoked).toBe(true);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const client = createServiceClient({ isRevoked: true });

            expect(() => client.revoke()).toThrow("ALREADY_REVOKED");
        });

        it("should throw when system-managed", () => {
            const client = createServiceClient({ isSystemManaged: true });

            expect(() => client.revoke()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("restore", () => {
        it("should restore a revoked client", () => {
            const client = createServiceClient({ isRevoked: true });

            client.restore();

            expect(client.isRevoked).toBe(false);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const client = createServiceClient();

            expect(() => client.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should throw when system-managed", () => {
            const client = createServiceClient({ isSystemManaged: true });

            expect(() => client.restore()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active client", () => {
            const client = createServiceClient();

            expect(() => client.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for system-managed client regardless of revoked state", () => {
            const client = createServiceClient({ isSystemManaged: true, isRevoked: true });

            expect(() => client.canPurge()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should pass for revoked non-system client", () => {
            const client = createServiceClient({ isRevoked: true });

            expect(() => client.canPurge()).not.toThrow();
        });
    });

    describe("applyRealmRevocation", () => {
        it("should mark as realm-revoked and bump realmVersion", () => {
            const client = createServiceClient({ realmVersion: 1 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const client = createServiceClient({ realmVersion: 2 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed clients", () => {
            const client = createServiceClient({ isSystemManaged: true, realmVersion: 1 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });
    });

    describe("applyRealmRestore", () => {
        it("should clear realm-revoked flag and bump realmVersion", () => {
            const client = createServiceClient({ realmVersion: 2, isRealmRevoked: true });

            client.applyRealmRestore(3);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(3);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const client = createServiceClient({ realmVersion: 2, isRealmRevoked: true });

            client.applyRealmRestore(2);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed clients", () => {
            const client = createServiceClient({
                isSystemManaged: true,
                isRealmRevoked: true,
                realmVersion: 1,
            });

            client.applyRealmRestore(2);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });
    });
});
