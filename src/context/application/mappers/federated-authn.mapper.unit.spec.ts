import { describe, expect, it } from "@jest/globals";

import { FederatedAuthnMapper } from "./federated-authn.mapper";

const mapper = new FederatedAuthnMapper();

describe("FederatedAuthnMapper", () => {
    describe("blacklistPayload", () => {
        it("returns the revoked session payloads unchanged", () => {
            const revokedSessions = [
                { session: "00000000-0000-4000-8000-300000000001", expiresAt: 1_789_000_000_000 },
                { session: "00000000-0000-4000-8000-300000000002", expiresAt: 1_789_000_000_001 },
            ];

            const result = mapper.blacklistPayload({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                revokedSessions,
            });

            expect(result).toBe(revokedSessions);
        });
    });
});
