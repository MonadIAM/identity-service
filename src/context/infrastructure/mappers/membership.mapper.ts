import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class MembershipMapper implements Repositories.Mappers.Contract<
    Entities.Membership,
    Repositories.Mappers.Membership.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Membership.Filters,
        basic: ORM.ObjectQuery<Entities.Membership> = {},
    ): ORM.ObjectQuery<Entities.Membership> {
        const where: ORM.ObjectQuery<Entities.Membership> = basic;

        if ("realm" in filters && filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }
        if ("account" in filters && filters.account) {
            where.account = ORMAdapter.applyStringFilter(filters.account);
        }
        if ("invitedBy" in filters && filters.invitedBy) {
            where.invitedBy = ORMAdapter.applyStringFilter(filters.invitedBy);
        }
        if (filters.joinedAt) {
            where.joinedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.joinedAt);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

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
