import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class ApplicationFixture extends CoreFixture implements Fixtures.Application.Contract {
    /**
     * Builds full and available realms to verify revoked applications occupy the configured per-realm limit.
     */
    public async limitScenario(): Fixtures.Application.LimitScenario.Result {
        const fullRealm = randomUUID();
        const availableRealm = randomUUID();

        await this.createApplication({
            name: "First Application",
            realm: fullRealm,
        });
        await this.createApplication({
            name: "Revoked Application",
            realm: fullRealm,
            isRevoked: true,
        });
        await this.createApplication({
            name: "Available Application",
            realm: availableRealm,
        });

        return { fullRealm, availableRealm };
    }
}
