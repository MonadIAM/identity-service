import { MembershipHistoryService } from "~context/domain/services/membership-history.service";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class MembershipHistoryUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Domain.MembershipHistory.Contract
{
    public service(props: Unit.Domain.MembershipHistory.Service.Props = {}): Unit.Domain.MembershipHistory.Service.Result {
        const repositories = this.repositories(props);
        const transaction = this.transaction();

        return {
            service: new MembershipHistoryService(
                this.contract<Repositories.MembershipHistory.PublicContract>(repositories.membershipHistories),
            ),
            repositories,
            transaction,
        };
    }
}
