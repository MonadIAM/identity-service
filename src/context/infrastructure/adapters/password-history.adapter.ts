import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { PasswordHistory } from "~context/domain/entities";

export class PasswordHistoryAdapter {
    protected buildWhereORM(
        filters: Repositories.PasswordHistory.Filters,
        basic: ObjectQuery<PasswordHistory> = {},
    ): ObjectQuery<PasswordHistory> {
        const where: ObjectQuery<PasswordHistory> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }

        if (filters.version) {
            where.version = MikroAdapter.applyOrdinalFilter<number>(filters.version);
        }
        if (filters.setAt) {
            where.setAt = MikroAdapter.applyOrdinalFilter<Date>(filters.setAt);
        }

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.PasswordHistory.Sort,
        pagination: Pagination,
        basic: FindOptions<PasswordHistory, P, F> = {},
    ): FindOptions<PasswordHistory, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<PasswordHistory>(sort, { setAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
