import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class PasswordHistoryAdapter implements Adapters.Contract<Entities.PasswordHistory, Adapters.PasswordHistory.Types> {
    public buildWhereORM(
        _filters: Adapters.PasswordHistory.Filters,
        basic: ObjectQuery<Entities.PasswordHistory> = {},
    ): ObjectQuery<Entities.PasswordHistory> {
        const where: ObjectQuery<Entities.PasswordHistory> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.PasswordHistory.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.PasswordHistory, P, F> = {},
    ): FindOptions<Entities.PasswordHistory, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.PasswordHistory>(sort, { setAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
