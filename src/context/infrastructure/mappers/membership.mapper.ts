import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class MembershipMapper implements Repositories.Mappers.Contract<
    Entities.Membership,
    Repositories.Mappers.Membership.Types
> {
    public buildWhereORM(
        _filters: Repositories.Mappers.Membership.Filters,
        basic: ORM.ObjectQuery<Entities.Membership> = {},
    ): ORM.ObjectQuery<Entities.Membership> {
        const where: ORM.ObjectQuery<Entities.Membership> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Membership.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Membership, P, F> = {},
    ): ORM.FindOptions<Entities.Membership, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Membership>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
