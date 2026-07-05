import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { TokenGrantType } from "~context/enums";

import { OAuthClient } from "./oauth-client.entity";

function createOAuthClient(overrides?: Partial<Entities.OAuthClient.ConstructorProps>): OAuthClient {
    return new OAuthClient({
        grantTypes: [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN],
        redirectUri: "https://example.com/callback",
        realm: "00000001-0000-4000-8000-100000000001",
        name: "Test Client",
        ...overrides,
    });
}

describe("OAuthClient Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const client = createOAuthClient({
                grantTypes: [TokenGrantType.AUTHORIZATION_CODE],
                redirectUri: "https://app.example.com/cb",
                realm: "00000001-0000-4000-8000-100000000002",
                name: "My App",
            });

            expect(client.grantTypes).toEqual([TokenGrantType.AUTHORIZATION_CODE]);
            expect(client.redirectUri).toBe("https://app.example.com/cb");
            expect(client.realm).toBe("00000001-0000-4000-8000-100000000002");
            expect(client.name).toBe("My App");
        });

        it("should assign optional description when provided", () => {
            const client = createOAuthClient({ description: "Internal admin client" });

            expect(client.description).toBe("Internal admin client");
        });

        it("should leave description undefined when omitted", () => {
            const client = createOAuthClient();

            expect(client.description).toBeUndefined();
        });

        it("should auto-generate id, createdAt and default version", () => {
            const client = createOAuthClient();

            expect(isUUID(client.id, "4")).toBe(true);
            expect(client.createdAt).toBeInstanceOf(Date);
            expect(client.version).toBe(1);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should default isRevoked, isRealmRevoked and realmVersion when omitted", () => {
            const client = createOAuthClient();

            expect(client.isRevoked).toBe(false);
            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(0);
        });

        it("should assign isRevoked, isRealmRevoked and realmVersion when provided", () => {
            const client = createOAuthClient({ isRevoked: true, isRealmRevoked: true, realmVersion: 3 });

            expect(client.isRevoked).toBe(true);
            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(3);
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const client = createOAuthClient({ name: "Old Name" });

            client.update({ name: "New Name" });

            expect(client.name).toBe("New Name");
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const client = createOAuthClient({ name: "Old", redirectUri: "https://old.example.com/cb" });

            client.update({ name: "New", redirectUri: "https://new.example.com/cb" });

            expect(client.name).toBe("New");
            expect(client.redirectUri).toBe("https://new.example.com/cb");
        });

        it("should skip unchanged fields but still apply changed ones", () => {
            const client = createOAuthClient({ name: "Same", redirectUri: "https://old.example.com/cb" });

            client.update({ name: "Same", redirectUri: "https://new.example.com/cb" });

            expect(client.name).toBe("Same");
            expect(client.redirectUri).toBe("https://new.example.com/cb");
        });

        it("should ignore undefined values in patch", () => {
            const client = createOAuthClient({ description: "Original" });

            client.update({ name: "Updated", description: undefined });

            expect(client.name).toBe("Updated");
            expect(client.description).toBe("Original");
        });

        it("should throw when patch is an empty object", () => {
            const client = createOAuthClient();

            expect(() => client.update({})).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const client = createOAuthClient({ name: "Same" });

            expect(() => client.update({ name: "Same" })).toThrow("NO_CHANGES_DETECTED");
        });

        it("should throw when the client is revoked", () => {
            const client = createOAuthClient({ isRevoked: true });

            expect(() => client.update({ name: "New Name" })).toThrow("CANNOT_UPDATE_REVOKED");
        });
    });

    describe("revoke", () => {
        it("should mark the client as revoked and set updatedAt", () => {
            const client = createOAuthClient();

            client.revoke();

            expect(client.isRevoked).toBe(true);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const client = createOAuthClient({ isRevoked: true });

            expect(() => client.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should un-revoke the client and set updatedAt", () => {
            const client = createOAuthClient({ isRevoked: true });

            client.restore();

            expect(client.isRevoked).toBe(false);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when the client is already active", () => {
            const client = createOAuthClient({ isRevoked: false });

            expect(() => client.restore()).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should not throw when the client is revoked", () => {
            const client = createOAuthClient({ isRevoked: true });

            expect(() => client.canPurge()).not.toThrow();
        });

        it("should throw when the client is still active", () => {
            const client = createOAuthClient({ isRevoked: false });

            expect(() => client.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });
    });

    describe("applyRealmRevocation", () => {
        it("should mark the client as realm-revoked and bump realmVersion", () => {
            const client = createOAuthClient({ realmVersion: 0 });

            client.applyRealmRevocation(1);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(1);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should ignore stale versions that are not greater than the current one", () => {
            const client = createOAuthClient({ realmVersion: 2 });

            client.applyRealmRevocation(2);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeUndefined();
        });

        it("should ignore versions lower than the current one", () => {
            const client = createOAuthClient({ realmVersion: 5 });

            client.applyRealmRevocation(3);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(5);
        });
    });

    describe("applyRealmRestore", () => {
        it("should un-mark realm revocation and bump realmVersion", () => {
            const client = createOAuthClient({ isRealmRevoked: true, realmVersion: 1 });

            client.applyRealmRestore(2);

            expect(client.isRealmRevoked).toBe(false);
            expect(client.realmVersion).toBe(2);
            expect(client.updatedAt).toBeInstanceOf(Date);
        });

        it("should ignore stale versions that are not greater than the current one", () => {
            const client = createOAuthClient({ isRealmRevoked: true, realmVersion: 4 });

            client.applyRealmRestore(4);

            expect(client.isRealmRevoked).toBe(true);
            expect(client.realmVersion).toBe(4);
            expect(client.updatedAt).toBeUndefined();
        });
    });
});
