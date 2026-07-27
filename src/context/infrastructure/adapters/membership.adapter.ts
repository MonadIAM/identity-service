import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class MembershipAdapter implements Adapters.Contract<Entities.Membership, Adapters.Membership.Types> {
    public buildWhereORM(
        _filters: Adapters.Membership.Filters,
        basic: ORM.ObjectQuery<Entities.Membership> = {},
    ): ORM.ObjectQuery<Entities.Membership> {
        const where: ORM.ObjectQuery<Entities.Membership> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Membership.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Membership, P, F> = {},
    ): ORM.FindOptions<Entities.Membership, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Membership>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
