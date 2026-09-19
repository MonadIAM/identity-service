import { CoreFixture } from "./core.fixture";

export class ServiceClientFixture extends CoreFixture implements Fixtures.ServiceClient.Contract {
    /**
     * Builds full and available realms to verify revoked service clients occupy the per-realm limit.
     */
    public async limitScenario(): Fixtures.ServiceClient.LimitScenario.Result {
        const fullRealm = "00000000-0000-4000-8000-000000000001";
        const availableRealm = "00000000-0000-4000-8000-000000000002";
        await this.createServiceClient({
            realm: fullRealm,
            name: "Billing Client",
            code: "billing",
        });
        await this.createServiceClient({
            realm: fullRealm,
            name: "Revoked Client",
            code: "revoked",
            isRevoked: true,
        });
        await this.createServiceClient({
            realm: availableRealm,
            name: "Mailer Client",
            code: "mailer",
        });

        return { fullRealm, availableRealm };
    }
}
