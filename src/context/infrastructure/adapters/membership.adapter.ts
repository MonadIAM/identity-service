import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class MembershipAdapter implements Adapters.Contract<Entities.Membership, Adapters.Membership.Types> {
    public buildWhereORM(
        _filters: Adapters.Membership.Filters,
        basic: ObjectQuery<Entities.Membership> = {},
    ): ObjectQuery<Entities.Membership> {
        const where: ObjectQuery<Entities.Membership> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Membership.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Membership, P, F> = {},
    ): FindOptions<Entities.Membership, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Membership>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
