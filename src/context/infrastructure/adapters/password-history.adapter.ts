import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class PasswordHistoryAdapter implements Adapters.Contract<Entities.PasswordHistory, Adapters.PasswordHistory.Types> {
    public buildWhereORM(
        _filters: Adapters.PasswordHistory.Filters,
        basic: ORM.ObjectQuery<Entities.PasswordHistory> = {},
    ): ORM.ObjectQuery<Entities.PasswordHistory> {
        const where: ORM.ObjectQuery<Entities.PasswordHistory> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.PasswordHistory.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.PasswordHistory, P, F> = {},
    ): ORM.FindOptions<Entities.PasswordHistory, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.PasswordHistory>(sort, { setAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
