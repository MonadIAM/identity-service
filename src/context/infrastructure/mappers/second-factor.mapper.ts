import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class SecondFactorMapper implements Repositories.Mappers.Contract<
    Entities.SecondFactor,
    Repositories.Mappers.SecondFactor.Types
> {
    public buildWhereORM(
        _filters: Repositories.Mappers.SecondFactor.Filters,
        basic: ORM.ObjectQuery<Entities.SecondFactor> = {},
    ): ORM.ObjectQuery<Entities.SecondFactor> {
        const where: ORM.ObjectQuery<Entities.SecondFactor> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.SecondFactor.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.SecondFactor, P, F> = {},
    ): ORM.FindOptions<Entities.SecondFactor, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.SecondFactor>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
