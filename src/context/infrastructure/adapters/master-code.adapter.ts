import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class MasterCodeAdapter implements Adapters.Contract<Entities.MasterCode, Adapters.MasterCode.Types> {
    public buildWhereORM(
        _filters: Adapters.MasterCode.Filters,
        basic: ORM.ObjectQuery<Entities.MasterCode> = {},
    ): ORM.ObjectQuery<Entities.MasterCode> {
        const where: ORM.ObjectQuery<Entities.MasterCode> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.MasterCode.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.MasterCode, P, F> = {},
    ): ORM.FindOptions<Entities.MasterCode, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.MasterCode>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
