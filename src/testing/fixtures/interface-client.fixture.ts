import { CoreFixture } from "./core.fixture";

export class InterfaceClientFixture extends CoreFixture implements Fixtures.InterfaceClient.Contract {
    /**
     * Builds full and available applications to verify revoked interface clients occupy the per-application limit.
     */
    public async limitScenario(): Fixtures.InterfaceClient.LimitScenario.Result {
        const fullApplication = await this.createApplication({
            name: "Interface Full",
        });
        const availableApplication = await this.createApplication({
            name: "Interface Available",
        });

        await this.createInterfaceClient({
            application: fullApplication,
            name: "Browser Client",
        });
        await this.createInterfaceClient({
            application: fullApplication,
            name: "Revoked Client",
            isRevoked: true,
        });
        await this.createInterfaceClient({
            application: availableApplication,
            name: "Only Client",
        });

        return { fullApplication, availableApplication };
    }
}
