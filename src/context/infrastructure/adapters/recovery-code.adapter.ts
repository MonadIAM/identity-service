import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RecoveryCode } from "~context/domain/entities";

export class RecoveryCodeAdapter {
    protected buildWhereORM(
        filters: Repositories.RecoveryCode.Filters,
        basic: ObjectQuery<RecoveryCode> = {},
    ): ObjectQuery<RecoveryCode> {
        const where: ObjectQuery<RecoveryCode> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.usedAt) {
            where.usedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.usedAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.RecoveryCode.Sort,
        pagination: Pagination,
        basic: FindOptions<RecoveryCode, P, F> = {},
    ): FindOptions<RecoveryCode, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<RecoveryCode>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
