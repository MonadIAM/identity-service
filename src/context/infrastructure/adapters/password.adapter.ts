import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class PasswordAdapter implements Adapters.Contract<Entities.Password, Adapters.Password.Types> {
    public buildWhereORM(
        _filters: Adapters.Password.Filters,
        basic: ObjectQuery<Entities.Password> = {},
    ): ObjectQuery<Entities.Password> {
        const where: ObjectQuery<Entities.Password> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Password.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Password, P, F> = {},
    ): FindOptions<Entities.Password, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Password>(sort, { setAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
