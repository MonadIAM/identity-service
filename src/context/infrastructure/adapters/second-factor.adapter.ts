import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { SecondFactorType } from "~context/enums";
import { MikroAdapter } from "~infrastructure/database/utils";
import { SecondFactor } from "~context/domain/entities";

export class SecondFactorAdapter {
    protected buildWhereORM(
        filters: Repositories.SecondFactor.Filters,
        basic: ObjectQuery<SecondFactor> = {},
    ): ObjectQuery<SecondFactor> {
        const where: ObjectQuery<SecondFactor> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
        }
        if (filters.type) {
            where.type = MikroAdapter.applyStringFilter<SecondFactorType>(filters.type);
        }

        if (filters.confirmedAt) {
            where.confirmedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.confirmedAt);
        }
        if (filters.lastUsedAt) {
            where.lastUsedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.lastUsedAt);
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }

        if (filters.isPreferred !== undefined) {
            where.isPreferred = { $eq: filters.isPreferred };
        }

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.SecondFactor.Sort,
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
