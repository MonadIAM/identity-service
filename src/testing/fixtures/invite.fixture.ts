import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class InviteFixture extends CoreFixture implements Fixtures.Invite.Contract {
    /**
     * Builds a pending invite to verify that the partial unique index rejects a second pending invite.
     */
    public async pendingScenario(): Fixtures.Invite.PendingScenario.Result {
        const inviter = await this.createAccount();
        const invitee = await this.createAccount();
        const realm = randomUUID();
        const pending = await this.createInvite({ inviter, invitee, realm });

        return { inviter, invitee, pending, realm };
    }

    /**
     * Builds a cancelled invite to verify that the partial unique index covers pending rows only.
     */
    public async cancelledScenario(): Fixtures.Invite.CancelledScenario.Result {
        const { inviter, invitee, pending, realm } = await this.pendingScenario();

        pending.cancel();
        await this.entityManager.flush();

        return { cancelled: pending, inviter, invitee, realm };
    }
}
