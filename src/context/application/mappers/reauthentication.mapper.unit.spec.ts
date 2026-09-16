import { describe, expect, it } from "@jest/globals";

import { ReauthenticationMapper } from "./reauthentication.mapper";

const mapper = new ReauthenticationMapper();

describe("ReauthenticationMapper", () => {
    describe("grantPayload", () => {
        it("maps the session and expiration timestamp", () => {
            expect(
                mapper.grantPayload({
                    session: "00000000-0000-4000-8000-900000000001",
                    expiresAt: 1_789_000_000_000,
                }),
            ).toEqual({
                session: "00000000-0000-4000-8000-900000000001",
                expiresAt: 1_789_000_000_000,
            });
        });
    });
});
