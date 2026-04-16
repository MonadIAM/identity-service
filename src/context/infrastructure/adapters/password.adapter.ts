import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Password } from "~context/domain/entities";

export class PasswordAdapter implements Adapters.Contract<Password, Adapters.Password.Types> {
    public buildWhereORM(_filters: Adapters.Password.Filters, basic: ObjectQuery<Password> = {}): ObjectQuery<Password> {
        const where: ObjectQuery<Password> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Password.Sort,
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
