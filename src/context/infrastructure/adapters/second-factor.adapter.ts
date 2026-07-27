import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class SecondFactorAdapter implements Adapters.Contract<Entities.SecondFactor, Adapters.SecondFactor.Types> {
    public buildWhereORM(
        _filters: Adapters.SecondFactor.Filters,
        basic: ORM.ObjectQuery<Entities.SecondFactor> = {},
    ): ORM.ObjectQuery<Entities.SecondFactor> {
        const where: ORM.ObjectQuery<Entities.SecondFactor> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.SecondFactor.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.SecondFactor, P, F> = {},
    ): ORM.FindOptions<Entities.SecondFactor, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.SecondFactor>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
