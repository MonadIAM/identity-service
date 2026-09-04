import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { TokenGrantType } from "~context/enums";

import { InterfaceClient } from "./interface-client.entity";
import { Application } from "./application.entity";

function createInterfaceClient(overrides?: Partial<Entities.InterfaceClient.ConstructorProps>): InterfaceClient {
    return new InterfaceClient({
        name: "Web App",
        redirectUris: ["https://example.com/callback"],
        authAddress: "https://example.com",
        grantTypes: [TokenGrantType.AUTHORIZATION_CODE],
        application: {} as Application,
        ...overrides,
    });
}

describe("InterfaceClient Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const application = {} as Application;

            const interfaceClient = createInterfaceClient({
                name: "SPA",
                redirectUris: ["https://spa.example.com/callback"],
                authAddress: "https://spa.example.com",
                grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                application,
            });

            expect(interfaceClient.name).toBe("SPA");
            expect(interfaceClient.redirectUris).toEqual(["https://spa.example.com/callback"]);
            expect(interfaceClient.authAddress).toBe("https://spa.example.com");
            expect(interfaceClient.grantTypes).toEqual([TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN]);
            expect(interfaceClient.application).toBe(application);
        });

        it("should default booleans to false", () => {
            const interfaceClient = createInterfaceClient();

            expect(interfaceClient.isSystemManaged).toBe(false);
            expect(interfaceClient.isApplicationRevoked).toBe(false);
            expect(interfaceClient.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const interfaceClient = createInterfaceClient({
                isSystemManaged: true,
                isApplicationRevoked: true,
                isRevoked: true,
            });

            expect(interfaceClient.isSystemManaged).toBe(true);
            expect(interfaceClient.isApplicationRevoked).toBe(true);
            expect(interfaceClient.isRevoked).toBe(true);
        });

        it("should default applicationVersion to 0", () => {
            const interfaceClient = createInterfaceClient();

            expect(interfaceClient.applicationVersion).toBe(0);
        });

        it("should respect explicit applicationVersion", () => {
            const interfaceClient = createInterfaceClient({ applicationVersion: 5 });

            expect(interfaceClient.applicationVersion).toBe(5);
        });

        it("should auto-generate id, createdAt, version", () => {
            const interfaceClient = createInterfaceClient();

            expect(isUUID(interfaceClient.id, "4")).toBe(true);
            expect(interfaceClient.createdAt).toBeInstanceOf(Date);
            expect(interfaceClient.version).toBe(1);
            expect(interfaceClient.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const interfaceClient = createInterfaceClient({ description: "First-party SPA" });
            expect(interfaceClient.description).toBe("First-party SPA");
        });

        it("should leave description undefined when omitted", () => {
            const interfaceClient = createInterfaceClient();
            expect(interfaceClient.description).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const interfaceClient = createInterfaceClient({ name: "Old" });

            interfaceClient.update({ name: "New" });

            expect(interfaceClient.name).toBe("New");
            expect(interfaceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const interfaceClient = createInterfaceClient({
                redirectUris: ["https://old.example.com/callback"],
                authAddress: "https://old.example.com",
            });

            interfaceClient.update({
                redirectUris: ["https://new.example.com/callback", "https://new.example.com/silent"],
                authAddress: "https://new.example.com",
            });

            expect(interfaceClient.redirectUris).toEqual([
                "https://new.example.com/callback",
                "https://new.example.com/silent",
            ]);
            expect(interfaceClient.authAddress).toBe("https://new.example.com");
        });

        it("should not treat an identical redirect URI list as a change", () => {
            const interfaceClient = createInterfaceClient({
                redirectUris: ["https://example.com/callback", "https://example.com/silent"],
            });

            expect(() =>
                interfaceClient.update({
                    redirectUris: ["https://example.com/callback", "https://example.com/silent"],
                }),
            ).toThrow();
            expect(interfaceClient.updatedAt).toBeUndefined();
        });

        it("should skip unchanged fields", () => {
            const interfaceClient = createInterfaceClient({ name: "Same", description: "Old" });

            interfaceClient.update({ name: "Same", description: "New" });

            expect(interfaceClient.name).toBe("Same");
            expect(interfaceClient.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const interfaceClient = createInterfaceClient({ name: "Original" });

            interfaceClient.update({ name: "Updated", description: undefined });

            expect(interfaceClient.name).toBe("Updated");
            expect(interfaceClient.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const interfaceClient = createInterfaceClient();

            expect(() => interfaceClient.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const interfaceClient = createInterfaceClient({ name: "Same" });

            expect(() => interfaceClient.update({ name: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });

        it("should throw when system-managed", () => {
            const interfaceClient = createInterfaceClient({ isSystemManaged: true });

            expect(() => interfaceClient.update({ name: "New" })).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should throw when revoked", () => {
            const interfaceClient = createInterfaceClient();
            interfaceClient.revoke();

            expect(() => interfaceClient.update({ name: "New" })).toThrow("CANNOT_UPDATE_REVOKED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active interface client", () => {
            const interfaceClient = createInterfaceClient();
            interfaceClient.revoke();

            expect(interfaceClient.isRevoked).toBe(true);
            expect(interfaceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const interfaceClient = createInterfaceClient();
            interfaceClient.revoke();

            expect(() => interfaceClient.revoke()).toThrow("ALREADY_REVOKED");
        });

        it("should throw when system-managed", () => {
            const interfaceClient = createInterfaceClient({ isSystemManaged: true });

            expect(() => interfaceClient.revoke()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("restore", () => {
        it("should restore a revoked interface client", () => {
            const interfaceClient = createInterfaceClient();
            interfaceClient.revoke();
            interfaceClient.restore();

            expect(interfaceClient.isRevoked).toBe(false);
            expect(interfaceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const interfaceClient = createInterfaceClient();

            expect(() => interfaceClient.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should throw when system-managed", () => {
            const interfaceClient = createInterfaceClient({ isSystemManaged: true });

            expect(() => interfaceClient.restore()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active interface client", () => {
            const interfaceClient = createInterfaceClient();

            expect(() => interfaceClient.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for system-managed interface client regardless of revoked state", () => {
            const interfaceClient = createInterfaceClient({ isSystemManaged: true, isRevoked: true });

            expect(() => interfaceClient.canPurge()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should pass for revoked non-system interface client", () => {
            const interfaceClient = createInterfaceClient();
            interfaceClient.revoke();

            expect(() => interfaceClient.canPurge()).not.toThrow();
        });
    });

    describe("applyApplicationRevocation", () => {
        it("should mark as application-revoked and bump applicationVersion", () => {
            const interfaceClient = createInterfaceClient({ applicationVersion: 1 });

            interfaceClient.applyApplicationRevocation(2);

            expect(interfaceClient.isApplicationRevoked).toBe(true);
            expect(interfaceClient.applicationVersion).toBe(2);
            expect(interfaceClient.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const interfaceClient = createInterfaceClient({ applicationVersion: 2 });

            interfaceClient.applyApplicationRevocation(2);

            expect(interfaceClient.isApplicationRevoked).toBe(false);
            expect(interfaceClient.applicationVersion).toBe(2);
            expect(interfaceClient.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed interface clients", () => {
            const interfaceClient = createInterfaceClient({ isSystemManaged: true, applicationVersion: 1 });

            interfaceClient.applyApplicationRevocation(2);

            expect(interfaceClient.isApplicationRevoked).toBe(false);
            expect(interfaceClient.applicationVersion).toBe(1);
        });
    });

    describe("applyApplicationRestore", () => {
        it("should clear application-revoked flag and bump applicationVersion", () => {
            const interfaceClient = createInterfaceClient({ applicationVersion: 1 });
            interfaceClient.applyApplicationRevocation(2);

            interfaceClient.applyApplicationRestore(3);

            expect(interfaceClient.isApplicationRevoked).toBe(false);
            expect(interfaceClient.applicationVersion).toBe(3);
        });

        it("should be a no-op when version is not greater than current", () => {
            const interfaceClient = createInterfaceClient({ applicationVersion: 2, isApplicationRevoked: true });

            interfaceClient.applyApplicationRestore(2);

            expect(interfaceClient.isApplicationRevoked).toBe(true);
            expect(interfaceClient.applicationVersion).toBe(2);
        });

        it("should be a no-op for system-managed interface clients", () => {
            const interfaceClient = createInterfaceClient({
                isSystemManaged: true,
                isApplicationRevoked: true,
                applicationVersion: 1,
            });

            interfaceClient.applyApplicationRestore(2);

            expect(interfaceClient.isApplicationRevoked).toBe(true);
            expect(interfaceClient.applicationVersion).toBe(1);
        });
    });
});
