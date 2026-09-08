import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class MembershipHistoryFixture extends CoreFixture implements Fixtures.MembershipHistory.Contract {
    /**
     * Builds an open membership period to verify that the partial unique index rejects a second open period.
     */
    public async openPeriodScenario(): Fixtures.MembershipHistory.OpenPeriodScenario.Result {
        const account = randomUUID();
        const realm = randomUUID();
        const open = await this.createMembershipHistory({ account, realm });

        return { account, open, realm };
    }

    /**
     * Builds a closed membership period to verify that the partial unique index covers open periods only.
     */
    public async closedPeriodScenario(): Fixtures.MembershipHistory.ClosedPeriodScenario.Result {
        const { account, open, realm } = await this.openPeriodScenario();

        open.close(randomUUID());
        await this.entityManager.flush();

        return { account, closed: open, realm };
    }
}
