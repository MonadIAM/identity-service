import { Inject, Injectable, Scope } from "@nestjs/common";

import { MEMBERSHIP_HISTORY_REPOSITORY } from "~context/domain/repositories";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipHistoryQueries implements Queries.MembershipHistory.Contract {
    public constructor(
        @Inject(MEMBERSHIP_HISTORY_REPOSITORY)
        private readonly membershipHistoryRepository: Repositories.MembershipHistory.QueryContract,
    ) {}

    public findUnique(props: Queries.MembershipHistory.FindUnique.Props): Queries.MembershipHistory.FindUnique.Result {
        const filter: ORM.ObjectQuery<Entities.MembershipHistory> = {};

        if (props.mode === QueryMode.DEFAULT) {
            filter.account = props.actor;
        }

        return this.membershipHistoryRepository.findUniqueOrThrow({
            where: { id: props.membershipHistory, ...filter },
        });
    }

    public findMany(props: Queries.MembershipHistory.FindMany.Props): Queries.MembershipHistory.FindMany.Result {
        const prefilter: ORM.ObjectQuery<Entities.MembershipHistory> = {};

        if (props.mode === QueryMode.DEFAULT) {
            prefilter.account = props.actor;
        }

        return this.membershipHistoryRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
