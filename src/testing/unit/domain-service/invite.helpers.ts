import { InviteService } from "~context/domain/services/invite.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class InviteUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Invite.Contract {
    public service(props: Unit.Domain.Invite.Service.Props = {}): Unit.Domain.Invite.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new InviteService(
                this.contract<Repositories.Membership.PublicContract>(repositories.memberships),
                this.contract<Repositories.Account.PublicContract>(repositories.accounts),
                this.contract<Repositories.Invite.PublicContract>(repositories.invites),
            ),
            repositories,
            transaction,
        };
    }
}
