import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { ServiceClient } from "./service-client.entity";
import { Application } from "./application.entity";

function createServiceClient(overrides?: Partial<Entities.ServiceClient.ConstructorProps>): ServiceClient {
    return new ServiceClient({
        name: "Billing Worker",
        clientSecretHash: "initial-hash",
        application: {} as Application,
        ...overrides,
    });
}

describe("ServiceClient Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const application = {} as Application;

            const serviceClient = createServiceClient({
                name: "Reporting Worker",
                clientSecretHash: "hash-1",
                application,
            });

            expect(serviceClient.name).toBe("Reporting Worker");
            expect(serviceClient.clientSecretHash).toBe("hash-1");
            expect(serviceClient.application).toBe(application);
        });

        it("should default booleans to false", () => {
            const serviceClient = createServiceClient();

            expect(serviceClient.isSystemManaged).toBe(false);
            expect(serviceClient.isApplicationRevoked).toBe(false);
            expect(serviceClient.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const serviceClient = createServiceClient({
                isSystemManaged: true,
                isApplicationRevoked: true,
                isRevoked: true,
            });

            expect(serviceClient.isSystemManaged).toBe(true);
            expect(serviceClient.isApplicationRevoked).toBe(true);
            expect(serviceClient.isRevoked).toBe(true);
        });

        it("should default applicationVersion to 0", () => {
            const serviceClient = createServiceClient();

            expect(serviceClient.applicationVersion).toBe(0);
        });

        it("should default allowedAddresses to an empty array", () => {
            const serviceClient = createServiceClient();

            expect(serviceClient.allowedAddresses).toEqual([]);
        });

        it("should respect explicit allowedAddresses", () => {
            const serviceClient = createServiceClient({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

            expect(serviceClient.allowedAddresses).toEqual(["10.0.0.1", "10.0.0.2"]);
        });

        it("should auto-generate id, createdAt, version", () => {
            const serviceClient = createServiceClient();

            expect(isUUID(serviceClient.id, "4")).toBe(true);
            expect(serviceClient.createdAt).toBeInstanceOf(Date);
            expect(serviceClient.version).toBe(1);
            expect(serviceClient.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const serviceClient = createServiceClient({ description: "Internal worker" });
            expect(serviceClient.description).toBe("Internal worker");
        });

        it("should leave description undefined when omitted", () => {
            const serviceClient = createServiceClient();
            expect(serviceClient.description).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const serviceClient = createServiceClient({ name: "Old" });

            serviceClient.update({ name: "New" });

            expect(serviceClient.name).toBe("New");
            expect(serviceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const serviceClient = createServiceClient({ name: "Old", description: "Old desc" });

            serviceClient.update({ name: "New", description: "New desc" });

            expect(serviceClient.name).toBe("New");
            expect(serviceClient.description).toBe("New desc");
        });

        it("should skip unchanged fields", () => {
            const serviceClient = createServiceClient({ name: "Same", description: "Old" });

            serviceClient.update({ name: "Same", description: "New" });

            expect(serviceClient.name).toBe("Same");
            expect(serviceClient.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const serviceClient = createServiceClient({ name: "Original" });

            serviceClient.update({ name: "Updated", description: undefined });

            expect(serviceClient.name).toBe("Updated");
            expect(serviceClient.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const serviceClient = createServiceClient();

            expect(() => serviceClient.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const serviceClient = createServiceClient({ name: "Same" });

            expect(() => serviceClient.update({ name: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });

        it("should throw when system-managed", () => {
            const serviceClient = createServiceClient({ isSystemManaged: true });

            expect(() => serviceClient.update({ name: "New" })).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should throw when revoked", () => {
            const serviceClient = createServiceClient();
            serviceClient.revoke();

            expect(() => serviceClient.update({ name: "New" })).toThrow("CANNOT_UPDATE_REVOKED");
        });

        describe("allowedAddresses change detection", () => {
            it("should detect a change when array length differs", () => {
                const serviceClient = createServiceClient({ allowedAddresses: ["10.0.0.1"] });

                serviceClient.update({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

                expect(serviceClient.allowedAddresses).toEqual(["10.0.0.1", "10.0.0.2"]);
                expect(serviceClient.updatedAt).toBeInstanceOf(Date);
            });

            it("should detect a change when elements differ at the same length", () => {
                const serviceClient = createServiceClient({ allowedAddresses: ["10.0.0.1"] });

                serviceClient.update({ allowedAddresses: ["10.0.0.2"] });

                expect(serviceClient.allowedAddresses).toEqual(["10.0.0.2"]);
            });

            it("should treat an identical array as unchanged", () => {
                const serviceClient = createServiceClient({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] });

                expect(() => serviceClient.update({ allowedAddresses: ["10.0.0.1", "10.0.0.2"] })).toThrow(
                    "NO_CHANGES_DETECTED",
                );
            });
        });
    });

    describe("regenerateSecret", () => {
        it("should replace clientSecretHash and touch updatedAt", () => {
            const serviceClient = createServiceClient({ clientSecretHash: "old-hash" });

            serviceClient.regenerateSecret("new-hash");

            expect(serviceClient.clientSecretHash).toBe("new-hash");
            expect(serviceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when system-managed", () => {
            const serviceClient = createServiceClient({ isSystemManaged: true });

            expect(() => serviceClient.regenerateSecret("new-hash")).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should throw when revoked", () => {
            const serviceClient = createServiceClient();
            serviceClient.revoke();

            expect(() => serviceClient.regenerateSecret("new-hash")).toThrow("CANNOT_UPDATE_REVOKED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active service client", () => {
            const serviceClient = createServiceClient();
            serviceClient.revoke();

            expect(serviceClient.isRevoked).toBe(true);
            expect(serviceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const serviceClient = createServiceClient();
            serviceClient.revoke();

            expect(() => serviceClient.revoke()).toThrow("ALREADY_REVOKED");
        });

        it("should throw when system-managed", () => {
            const serviceClient = createServiceClient({ isSystemManaged: true });

            expect(() => serviceClient.revoke()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("restore", () => {
        it("should restore a revoked service client", () => {
            const serviceClient = createServiceClient();
            serviceClient.revoke();
            serviceClient.restore();

            expect(serviceClient.isRevoked).toBe(false);
            expect(serviceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const serviceClient = createServiceClient();

            expect(() => serviceClient.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should throw when system-managed", () => {
            const serviceClient = createServiceClient({ isSystemManaged: true });

            expect(() => serviceClient.restore()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active service client", () => {
            const serviceClient = createServiceClient();

            expect(() => serviceClient.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for system-managed service client regardless of revoked state", () => {
            const serviceClient = createServiceClient({ isSystemManaged: true, isRevoked: true });

            expect(() => serviceClient.canPurge()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should pass for revoked non-system service client", () => {
            const serviceClient = createServiceClient();
            serviceClient.revoke();

            expect(() => serviceClient.canPurge()).not.toThrow();
        });
    });

    describe("applyApplicationRevocation", () => {
        it("should mark as application-revoked and bump applicationVersion", () => {
            const serviceClient = createServiceClient({ applicationVersion: 1 });

            serviceClient.applyApplicationRevocation(2);

            expect(serviceClient.isApplicationRevoked).toBe(true);
            expect(serviceClient.applicationVersion).toBe(2);
            expect(serviceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const serviceClient = createServiceClient({ applicationVersion: 2 });

            serviceClient.applyApplicationRevocation(2);

            expect(serviceClient.isApplicationRevoked).toBe(false);
            expect(serviceClient.applicationVersion).toBe(2);
            expect(serviceClient.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed service clients", () => {
            const serviceClient = createServiceClient({ isSystemManaged: true, applicationVersion: 1 });

            serviceClient.applyApplicationRevocation(2);

            expect(serviceClient.isApplicationRevoked).toBe(false);
            expect(serviceClient.applicationVersion).toBe(1);
        });
    });

    describe("applyApplicationRestore", () => {
        it("should clear application-revoked flag and bump applicationVersion", () => {
            const serviceClient = createServiceClient({ applicationVersion: 1 });
            serviceClient.applyApplicationRevocation(2);

            serviceClient.applyApplicationRestore(3);

            expect(serviceClient.isApplicationRevoked).toBe(false);
            expect(serviceClient.applicationVersion).toBe(3);
        });

        it("should be a no-op when version is not greater than current", () => {
            const serviceClient = createServiceClient({ applicationVersion: 2, isApplicationRevoked: true });

            serviceClient.applyApplicationRestore(2);

            expect(serviceClient.isApplicationRevoked).toBe(true);
            expect(serviceClient.applicationVersion).toBe(2);
        });

        it("should be a no-op for system-managed service clients", () => {
            const serviceClient = createServiceClient({
                isSystemManaged: true,
                isApplicationRevoked: true,
                applicationVersion: 1,
            });

            serviceClient.applyApplicationRestore(2);

            expect(serviceClient.isApplicationRevoked).toBe(true);
            expect(serviceClient.applicationVersion).toBe(1);
        });
    });
});
