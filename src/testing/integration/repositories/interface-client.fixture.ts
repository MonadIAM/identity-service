import { CoreFixture } from "./core.fixture";

export class InterfaceClientFixture extends CoreFixture implements Fixtures.InterfaceClient.Contract {
    /**
     * Builds full and available realms to verify revoked interface clients occupy the per-realm limit.
     */
    public async limitScenario(): Fixtures.InterfaceClient.LimitScenario.Result {
        const fullRealm = "00000000-0000-4000-8000-000000000001";
        const availableRealm = "00000000-0000-4000-8000-000000000002";

        await this.createInterfaceClient({
            realm: fullRealm,
            name: "Browser Client",
        });
        await this.createInterfaceClient({
            realm: fullRealm,
            name: "Revoked Client",
            isRevoked: true,
        });
        await this.createInterfaceClient({
            realm: availableRealm,
            name: "Only Client",
        });

        return { fullRealm, availableRealm };
    }
}
