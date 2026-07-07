import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class ApplicationAdapter implements Adapters.Contract<Entities.Application, Adapters.Application.Types> {
    public buildWhereORM(
        filters: Adapters.Application.Filters,
        basic: ObjectQuery<Entities.Application> = {},
    ): ObjectQuery<Entities.Application> {
        const where: ObjectQuery<Entities.Application> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
        }
        if (filters.realm) {
            where.realm = MikroAdapter.applyStringFilter(filters.realm);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = filters.isRevoked;
        }
        if (filters.isRealmRevoked !== undefined) {
            where.isRealmRevoked = filters.isRealmRevoked;
        }
        if (filters.isSystemManaged !== undefined) {
            where.isSystemManaged = filters.isSystemManaged;
        }
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Application.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Application, P, F> = {},
    ): FindOptions<Entities.Application, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Application>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
