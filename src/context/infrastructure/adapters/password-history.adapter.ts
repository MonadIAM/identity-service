import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { PasswordHistory } from "~context/domain/entities";

export class PasswordHistoryAdapter implements Adapters.Contract<PasswordHistory, Adapters.PasswordHistory.Types> {
    public buildWhereORM(
        _filters: Adapters.PasswordHistory.Filters,
        basic: ObjectQuery<PasswordHistory> = {},
    ): ObjectQuery<PasswordHistory> {
        const where: ObjectQuery<PasswordHistory> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.PasswordHistory.Sort,
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
