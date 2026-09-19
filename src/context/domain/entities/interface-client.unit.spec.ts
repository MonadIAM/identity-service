import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { TokenGrantType } from "~context/enums";

import { InterfaceClient } from "./interface-client.entity";

function createInterfaceClient(overrides?: Partial<Entities.InterfaceClient.ConstructorProps>): InterfaceClient {
    return new InterfaceClient({
        name: "Web App",
        redirectUris: ["https://example.com/callback"],
        authAddress: "https://example.com",
        grantTypes: [TokenGrantType.AUTHORIZATION_CODE],
        realm: "00000000-0000-4000-8000-000000000001",
        ...overrides,
    });
}

describe("InterfaceClient Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const realm = "00000000-0000-4000-8000-000000000001";

            const client = createInterfaceClient({
                name: "SPA",
                redirectUris: ["https://spa.example.com/callback"],
                authAddress: "https://spa.example.com",
                grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
                realm,
            });

            expect(client.name).toBe("SPA");
            expect(client.redirectUris).toEqual(["https://spa.example.com/callback"]);
            expect(client.authAddress).toBe("https://spa.example.com");
            expect(client.grantTypes).toEqual([TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN]);
            expect(client.realm).toBe(realm);
        });

        it("should default booleans to false", () => {
            const client = createInterfaceClient();

            expect(client.isSystemManaged).toBe(false);
            expect(client.isRealmRevoked).toBe(false);
            expect(client.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const client = createInterfaceClient({
                isSystemManaged: true,
                isRealmRevoked: true,
                isRevoked: true,
            });

            expect(client.isSystemManaged).toBe(true);
            expect(client.isRealmRevoked).toBe(true);
            expect(client.isRevoked).toBe(true);
        });

        it("should default realmVersion to 0", () => {
            const client = createInterfaceClient();

            expect(client.realmVersion).toBe(0);
        });

        it("should respect explicit realmVersion", () => {
            const client = createInterfaceClient({ realmVersion: 5 });

            expect(client.realmVersion).toBe(5);
        });

        it("should auto-generate id, createdAt, version", () => {
            const client = createInterfaceClient();

            expect(isUUID(client.id, "4")).toBe(true);
            expect(client.createdAt).toBeInstanceOf(Date);
            expect(client.version).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const client = createInterfaceClient({ description: "First-party SPA" });

            expect(client.description).toBe("First-party SPA");
        });

        it("should leave description undefined when omitted", () => {
            const client = createInterfaceClient();

            expect(client.description).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const client = createInterfaceClient({ name: "Old" });

            client.update({ name: "New" });

            expect(client.name).toBe("New");
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const client = createInterfaceClient({ name: "Old", description: "Old desc" });

            client.update({ name: "New", description: "New desc" });

            expect(client.name).toBe("New");
            expect(client.description).toBe("New desc");
        });

        it("should skip unchanged fields", () => {
            const client = createInterfaceClient({ name: "Same", description: "Old" });

            client.update({ name: "Same", description: "New" });

            expect(client.name).toBe("Same");
            expect(client.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const client = createInterfaceClient({ name: "Original" });

            client.update({ name: "Updated", description: undefined });

            expect(client.name).toBe("Updated");
            expect(client.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const client = createInterfaceClient();

            expect(() => client.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const client = createInterfaceClient({ name: "Same" });

            expect(() => client.update({ name: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });

        it("should throw when system-managed", () => {
            const client = createInterfaceClient({ isSystemManaged: true });

            expect(() => client.update({ name: "New" })).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should throw when revoked", () => {
            const client = createInterfaceClient({ isRevoked: true });

            expect(() => client.update({ name: "New" })).toThrow("CANNOT_UPDATE_REVOKED");
        });

        it("should update auth address and redirect URIs", () => {
            const client = createInterfaceClient({
                redirectUris: ["https://old.example.com/callback"],
                authAddress: "https://old.example.com",
            });

            client.update({
                redirectUris: ["https://new.example.com/callback", "https://new.example.com/silent"],
                authAddress: "https://new.example.com",
            });

            expect(client.redirectUris).toEqual(["https://new.example.com/callback", "https://new.example.com/silent"]);
            expect(client.authAddress).toBe("https://new.example.com");
        });

        describe("redirectUris change detection", () => {
            it("should detect a change when array length differs", () => {
                const client = createInterfaceClient({ redirectUris: ["https://example.com/callback"] });

                client.update({ redirectUris: ["https://example.com/callback", "https://example.com/silent"] });

                expect(client.redirectUris).toEqual(["https://example.com/callback", "https://example.com/silent"]);
                expect(client.updatedAt).toBeInstanceOf(Date);
            });

            it("should detect a change when elements differ at the same length", () => {
                const client = createInterfaceClient({ redirectUris: ["https://example.com/callback"] });

                client.update({ redirectUris: ["https://example.com/silent"] });

                expect(client.redirectUris).toEqual(["https://example.com/silent"]);
                expect(client.updatedAt).toBeInstanceOf(Date);
            });

            it("should treat an identical array as unchanged", () => {
                const client = createInterfaceClient({
                    redirectUris: ["https://example.com/callback", "https://example.com/silent"],
                });

                expect(() =>
                    client.update({ redirectUris: ["https://example.com/callback", "https://example.com/silent"] }),
                ).toThrow("NO_CHANGES_DETECTED");
                expect(client.updatedAt).toBeUndefined();
            });
        });
    });

    describe("revoke", () => {
        it("should revoke an active client", () => {
            const client = createInterfaceClient();

            client.revoke();

            expect(client.isRevoked).toBe(true);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const client = createInterfaceClient({ isRevoked: true });

            expect(() => client.revoke()).toThrow("ALREADY_REVOKED");
        });

        it("should throw when system-managed", () => {
            const client = createInterfaceClient({ isSystemManaged: true });

            expect(() => client.revoke()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("restore", () => {
        it("should restore a revoked client", () => {
            const client = createInterfaceClient({ isRevoked: true });

            client.restore();

            expect(client.isRevoked).toBe(false);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const client = createInterfaceClient();

            expect(() => client.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should throw when system-managed", () => {
            const client = createInterfaceClient({ isSystemManaged: true });

            expect(() => client.restore()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active client", () => {
            const client = createInterfaceClient();

            expect(() => client.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for system-managed client regardless of revoked state", () => {
            const client = createInterfaceClient({ isSystemManaged: true, isRevoked: true });

            expect(() => client.canPurge()).toThrow("SYSTEM_MANAGED_IMMUTABLE");
        });

        it("should pass for revoked non-system client", () => {
            const client = createInterfaceClient({ isRevoked: true });

            expect(() => client.canPurge()).not.toThrow();
        });
    });

    describe("applyRealmRevocation", () => {
        it("should mark as realm-revoked and bump realmVersion", () => {
            const client = createInterfaceClient({ realmVersion: 1 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const client = createInterfaceClient({ realmVersion: 2 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed clients", () => {
            const client = createInterfaceClient({ isSystemManaged: true, realmVersion: 1 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });
    });

    describe("applyRealmRestore", () => {
        it("should clear realm-revoked flag and bump realmVersion", () => {
            const client = createInterfaceClient({ realmVersion: 2, isRealmRevoked: true });

            client.applyRealmRestore(3);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(3);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should be a no-op when version is not greater than current", () => {
            const client = createInterfaceClient({ realmVersion: 2, isRealmRevoked: true });

            client.applyRealmRestore(2);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should be a no-op for system-managed clients", () => {
            const client = createInterfaceClient({
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
