import { CoreFixture } from "./core.fixture";

export class ServiceClientFixture extends CoreFixture implements Fixtures.ServiceClient.Contract {
    /**
     * Builds full and available applications to verify revoked service clients occupy the per-application limit.
     */
    public async limitScenario(): Fixtures.ServiceClient.LimitScenario.Result {
        const fullApplication = await this.createApplication({
            name: "Service Full",
        });
        const availableApplication = await this.createApplication({
            name: "Service Available",
        });
        await this.createServiceClient({
            application: fullApplication,
            name: "Billing Client",
            code: "billing",
        });
        await this.createServiceClient({
            application: fullApplication,
            name: "Revoked Client",
            code: "revoked",
            isRevoked: true,
        });
        await this.createServiceClient({
            application: availableApplication,
            name: "Mailer Client",
            code: "mailer",
        });

        return { fullApplication, availableApplication };
    }
}
