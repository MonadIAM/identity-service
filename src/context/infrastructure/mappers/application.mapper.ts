import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class ApplicationMapper implements Repositories.Mappers.Contract<
    Entities.Application,
    Repositories.Mappers.Application.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.Application.Filters,
        basic: ORM.ObjectQuery<Entities.Application> = {},
    ): ORM.ObjectQuery<Entities.Application> {
        const where: ORM.ObjectQuery<Entities.Application> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.name) {
            where.name = ORMAdapter.applyStringFilter(filters.name);
        }
        if (filters.realm) {
            where.realm = ORMAdapter.applyStringFilter(filters.realm);
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
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Application.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Application, P, F> = {},
    ): ORM.FindOptions<Entities.Application, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Application>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
