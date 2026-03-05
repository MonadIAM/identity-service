import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Password } from "~context/domain/entities";

export class PasswordAdapter {
    protected buildWhereORM(
        filters: Repositories.Password.Filters,
        basic: ObjectQuery<Password> = {},
    ): ObjectQuery<Password> {
        const where: ObjectQuery<Password> = basic;

        if (filters.account) {
            where.account = MikroAdapter.applyStringFilter(filters.account);
        }

        if (filters.setAt) {
            where.setAt = MikroAdapter.applyOrdinalFilter<Date>(filters.setAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Password.Sort,
        pagination: Pagination,
        basic: FindOptions<Password, P, F> = {},
    ): FindOptions<Password, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Password>(sort, { setAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
