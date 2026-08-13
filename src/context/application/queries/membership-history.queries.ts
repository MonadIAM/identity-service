import { Inject, Injectable, Scope } from "@nestjs/common";

import { MEMBERSHIP_HISTORY_REPOSITORY } from "~context/domain/repositories";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipHistoryQueries implements Queries.MembershipHistory.Contract {
    public constructor(
        @Inject(MEMBERSHIP_HISTORY_REPOSITORY)
        private readonly membershipHistoryRepository: Repositories.MembershipHistory.QueryContract,
    ) {}

    public findMany(props: Queries.MembershipHistory.FindMany.Props): Queries.MembershipHistory.FindMany.Result {
        const prefilter: ORM.ObjectQuery<Entities.MembershipHistory> = { leaveAt: { $ne: null } };

        if (props.mode === QueryMode.DEFAULT) {
            prefilter.account = props.actor;
        }

        if (props.mode === QueryMode.COMMON) {
            prefilter.realm = props.realm;
        }

        return this.membershipHistoryRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
