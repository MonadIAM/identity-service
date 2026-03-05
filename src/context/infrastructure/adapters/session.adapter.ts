import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Session } from "~context/domain/entities";

export class SessionAdapter {
    protected buildWhereORM(filters: Repositories.Session.Filters, basic: ObjectQuery<Session> = {}): ObjectQuery<Session> {
        const where: ObjectQuery<Session> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.ip) {
            where.ip = MikroAdapter.applyStringFilter(filters.ip);
        }
        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        if (filters.lastActiveAt) {
            where.lastActiveAt = MikroAdapter.applyOrdinalFilter<Date>(filters.lastActiveAt);
        }
        if (filters.expiresAt) {
            where.expiresAt = MikroAdapter.applyOrdinalFilter<Date>(filters.expiresAt);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Session.Sort,
        pagination: Pagination,
        basic: FindOptions<Session, P, F> = {},
    ): FindOptions<Session, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Session>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
