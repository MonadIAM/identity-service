import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class MembershipHistoryMapper implements Repositories.Mappers.Contract<
    Entities.MembershipHistory,
    Repositories.Mappers.MembershipHistory.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.MembershipHistory.Filters,
        basic: ORM.ObjectQuery<Entities.MembershipHistory> = {},
    ): ORM.ObjectQuery<Entities.MembershipHistory> {
        const where: ORM.ObjectQuery<Entities.MembershipHistory> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
        }
        if ("account" in filters && filters.account) {
            where.account = ORMAdapter.applyStringFilter(filters.account);
        }
        if ("invitedBy" in filters && filters.invitedBy) {
            where.invitedBy = ORMAdapter.applyStringFilter(filters.invitedBy);
        }
        if ("excludedBy" in filters && filters.excludedBy) {
            where.excludedBy = ORMAdapter.applyStringFilter(filters.excludedBy);
        }
        if (filters.joinedAt) {
            where.joinedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.joinedAt);
        }
        if (filters.leaveAt) {
            where.leaveAt = ORMAdapter.applyOrdinalFilter<Date>(filters.leaveAt);
        }
        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.MembershipHistory.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.MembershipHistory, P, F> = {},
    ): ORM.FindOptions<Entities.MembershipHistory, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.MembershipHistory>(sort, { createdAt: QueryOrder.DESC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
