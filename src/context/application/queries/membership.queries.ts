import { Inject, Injectable, Scope } from "@nestjs/common";

import { MEMBERSHIP_REPOSITORY } from "~context/infrastructure/repositories";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class MembershipQueries implements Queries.Membership.Contract {
    private readonly populate = ["account.profile"] as const;

    public constructor(
        @Inject(MEMBERSHIP_REPOSITORY)
        private readonly membershipRepository: Repositories.Membership.Contract,
    ) {}

    public findMany(props: Queries.Membership.FindMany.Props): Queries.Membership.FindMany.Result {
        const prefilter: ORM.ObjectQuery<Entities.Membership> = {};

        if (props.mode === QueryMode.DEFAULT) {
            prefilter.account = props.actor;
        }

        if (props.mode === QueryMode.COMMON) {
            prefilter.realm = props.realm;
        }

        return this.membershipRepository.findMany({
            options: { populate: this.populate },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
