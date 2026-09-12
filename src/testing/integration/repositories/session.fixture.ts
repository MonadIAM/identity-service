import { CoreFixture } from "./core.fixture";

export class SessionFixture extends CoreFixture implements Fixtures.Session.Contract {
    /**
     * Builds account sessions with refresh timestamps to verify stale session lock selection.
     */
    public async lockScenario(): Fixtures.Session.LockScenario.Result {
        const account = await this.createAccount();
        const other = await this.createAccount();
        const first = await this.createSession({
            account,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        const second = await this.createSession({
            account,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-01T00:00:00.000Z"),
        });
        const third = await this.createSession({
            account,
            createdAt: new Date("2026-01-03T00:00:00.000Z"),
            lastRefreshedAt: new Date("2026-01-04T00:00:00.000Z"),
        });
        const external = await this.createSession({
            account: other,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            lastRefreshedAt: new Date("2025-01-01T00:00:00.000Z"),
        });

        return { account, external, first, second, third };
    }
}
