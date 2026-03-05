import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { MasterCode } from "~context/domain/entities";

export class MasterCodeAdapter {
    protected buildWhereORM(
        filters: Repositories.MasterCode.Filters,
        basic: ObjectQuery<MasterCode> = {},
    ): ObjectQuery<MasterCode> {
        const where: ObjectQuery<MasterCode> = basic;

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.MasterCode.Sort,
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
