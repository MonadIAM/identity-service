import { describe, expect, it } from "@jest/globals";

import { ReauthenticationMapper } from "./reauthentication.mapper";

const mapper = new ReauthenticationMapper();

describe("[DataMapper] - Reauthentication", () => {
    describe("[Method] - grantPayload", () => {
        it("[case] - maps the session and expiration timestamp", () => {
            // Arrange

            // Act
            const result = mapper.grantPayload({
                session: "00000000-0000-4000-8000-900000000001",
                expiresAt: 1_789_000_000_000,
            });

            // Assert
            expect(result).toEqual({
                session: "00000000-0000-4000-8000-900000000001",
                expiresAt: 1_789_000_000_000,
            });
        });
    });
});
