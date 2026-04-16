import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { SecondFactor } from "~context/domain/entities";

export class SecondFactorAdapter implements Adapters.Contract<SecondFactor, Adapters.SecondFactor.Types> {
    public buildWhereORM(
        _filters: Adapters.SecondFactor.Filters,
        basic: ObjectQuery<SecondFactor> = {},
    ): ObjectQuery<SecondFactor> {
        const where: ObjectQuery<SecondFactor> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.SecondFactor.Sort,
        pagination: Pagination,
        basic: FindOptions<SecondFactor, P, F> = {},
    ): FindOptions<SecondFactor, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<SecondFactor>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
