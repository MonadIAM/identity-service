import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { MasterCode } from "~context/domain/entities";

export class MasterCodeAdapter implements Adapters.Contract<MasterCode, Adapters.MasterCode.Types> {
    public buildWhereORM(
        _filters: Adapters.MasterCode.Filters,
        basic: ObjectQuery<MasterCode> = {},
    ): ObjectQuery<MasterCode> {
        const where: ObjectQuery<MasterCode> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.MasterCode.Sort,
        pagination: Pagination,
        basic: FindOptions<MasterCode, P, F> = {},
    ): FindOptions<MasterCode, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<MasterCode>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
