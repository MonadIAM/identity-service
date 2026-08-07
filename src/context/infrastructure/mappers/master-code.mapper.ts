import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class MasterCodeMapper implements Repositories.Mappers.Contract<
    Entities.MasterCode,
    Repositories.Mappers.MasterCode.Types
> {
    public buildWhereORM(
        _filters: Repositories.Mappers.MasterCode.Filters,
        basic: ORM.ObjectQuery<Entities.MasterCode> = {},
    ): ORM.ObjectQuery<Entities.MasterCode> {
        const where: ORM.ObjectQuery<Entities.MasterCode> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.MasterCode.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.MasterCode, P, F> = {},
    ): ORM.FindOptions<Entities.MasterCode, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.MasterCode>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
