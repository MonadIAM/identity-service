import { MembershipService } from "~context/domain/services/membership.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class MembershipUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Domain.Membership.Contract {
    public service(props: Unit.Domain.Membership.Service.Props = {}): Unit.Domain.Membership.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();
        const services = this.services();

        return {
            service: new MembershipService(
                this.contract<Services.MembershipHistory.CommandContract>(services.membershipHistoryService),
                this.contract<Repositories.Membership.PublicContract>(repositories.memberships),
                this.contract<Repositories.Account.PublicContract>(repositories.accounts),
                this.contract<Repositories.Invite.PublicContract>(repositories.invites),
            ),
            repositories,
            transaction,
            services,
        };
    }
}
