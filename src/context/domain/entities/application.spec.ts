import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Application } from "./application.entity";

const REALM_ID = "00000000-0000-4000-8000-000000000001";

function createApplication(overrides?: Partial<Entities.Application.ConstructorProps>): Application {
    return new Application({
        realm: REALM_ID,
        name: "My App",
        ...overrides,
    });
}

describe("Application Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const application = createApplication({ realm: REALM_ID, name: "Billing" });

            expect(application.realm).toBe(REALM_ID);
            expect(application.name).toBe("Billing");
        });

        it("should default booleans to false", () => {
            const application = createApplication();

            expect(application.isSystemManaged).toBe(false);
            expect(application.isRealmRevoked).toBe(false);
            expect(application.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const application = createApplication({
                isSystemManaged: true,
                isRealmRevoked: true,
                isRevoked: true,
            });

            expect(application.isSystemManaged).toBe(true);
            expect(application.isRealmRevoked).toBe(true);
            expect(application.isRevoked).toBe(true);
        });

        it("should default realmVersion to 0", () => {
            const application = createApplication();

            expect(application.realmVersion).toBe(0);
        });

        it("should respect explicit realmVersion", () => {
            const application = createApplication({ realmVersion: 5 });

            expect(application.realmVersion).toBe(5);
        });

        it("should auto-generate id, createdAt, version", () => {
            const application = createApplication();

            expect(isUUID(application.id, "4")).toBe(true);
            expect(application.createdAt).toBeInstanceOf(Date);
            expect(application.version).toBe(1);
            expect(application.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const application = createApplication({ description: "Internal billing app" });
            expect(application.description).toBe("Internal billing app");
        });

        it("should leave description undefined when omitted", () => {
            const application = createApplication();
            expect(application.description).toBeUndefined();
        });

        it("should initialize interfaceClients and serviceClients as empty collections", () => {
            const application = createApplication();

            expect(application.interfaceClients.length).toBe(0);
            expect(application.serviceClients.length).toBe(0);
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const application = createApplication({ name: "Old" });

            application.update({ name: "New" });

            expect(application.name).toBe("New");
            expect(application.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const application = createApplication({ name: "Old", description: "Old desc" });

            application.update({ name: "New", description: "New desc" });

            expect(application.name).toBe("New");
            expect(application.description).toBe("New desc");
        });

        it("should skip unchanged fields", () => {
            const application = createApplication({ name: "Same", description: "Old" });

            application.update({ name: "Same", description: "New" });

            expect(application.name).toBe("Same");
            expect(application.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const application = createApplication({ name: "Original" });

            application.update({ name: "Updated", description: undefined });

            expect(application.name).toBe("Updated");
            expect(application.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const application = createApplication();

            expect(() => application.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const application = createApplication({ name: "Same" });

            expect(() => application.update({ name: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });

        it("should throw when application is system-managed", () => {
            const application = createApplication({ isSystemManaged: true });

            expect(() => application.update({ name: "New" })).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should throw when application is revoked", () => {
            const application = createApplication();
            application.revoke();

            expect(() => application.update({ name: "New" })).toThrow("CANNOT_UPDATE_REVOKED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active application", () => {
            const application = createApplication();
            application.revoke();

            expect(application.isRevoked).toBe(true);
            expect(application.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const application = createApplication();
            application.revoke();

            expect(() => application.revoke()).toThrow("ALREADY_REVOKED");
        });

        it("should throw when system-managed", () => {
            const application = createApplication({ isSystemManaged: true });

            expect(() => application.revoke()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("restore", () => {
        it("should restore a revoked application", () => {
            const application = createApplication();
            application.revoke();
            application.restore();

            expect(application.isRevoked).toBe(false);
            expect(application.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const application = createApplication();

            expect(() => application.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should throw when system-managed", () => {
            const application = createApplication({ isSystemManaged: true });

            expect(() => application.restore()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active application", () => {
            const application = createApplication();

            expect(() => application.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for system-managed application regardless of revoked state", () => {
            const application = createApplication({ isSystemManaged: true, isRevoked: true });

            expect(() => application.canPurge()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should pass for revoked non-system application", () => {
            const application = createApplication();
            application.revoke();

            expect(() => application.canPurge()).not.toThrow();
        });
    });

    describe("applyRealmRevocation", () => {
        it("should mark as realm-revoked and bump realmVersion", () => {
            const application = createApplication({ realmVersion: 1 });

            application.applyRealmRevocation(2);

            expect(application.isRealmRevoked).toBe(true);
            expect(application.realmVersion).toBe(2);
            expect(application.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const application = createApplication({ realmVersion: 2 });

            application.applyRealmRevocation(2);

            expect(application.isRealmRevoked).toBe(false);
            expect(application.realmVersion).toBe(2);
            expect(application.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed applications", () => {
            const application = createApplication({ isSystemManaged: true, realmVersion: 1 });

            application.applyRealmRevocation(2);

            expect(application.isRealmRevoked).toBe(false);
            expect(application.realmVersion).toBe(1);
        });
    });

    describe("applyRealmRestore", () => {
        it("should clear realm-revoked flag and bump realmVersion", () => {
            const application = createApplication({ realmVersion: 1 });
            application.applyRealmRevocation(2);

            application.applyRealmRestore(3);

            expect(application.isRealmRevoked).toBe(false);
            expect(application.realmVersion).toBe(3);
        });

        it("should be a no-op when version is not greater than current", () => {
            const application = createApplication({ realmVersion: 2, isRealmRevoked: true });

            application.applyRealmRestore(2);

            expect(application.isRealmRevoked).toBe(true);
            expect(application.realmVersion).toBe(2);
        });

        it("should be a no-op for system-managed applications", () => {
            const application = createApplication({
                isSystemManaged: true,
                isRealmRevoked: true,
                realmVersion: 1,
            });

            application.applyRealmRestore(2);

            expect(application.isRealmRevoked).toBe(true);
            expect(application.realmVersion).toBe(1);
        });
    });
});
