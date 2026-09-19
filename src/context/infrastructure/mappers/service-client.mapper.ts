import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class ServiceClientMapper implements Repositories.Mappers.Contract<
    Entities.ServiceClient,
    Repositories.Mappers.ServiceClient.Types
> {
    public buildWhereORM(
        filters: Repositories.Mappers.ServiceClient.Filters,
        basic: ORM.ObjectQuery<Entities.ServiceClient> = {},
    ): ORM.ObjectQuery<Entities.ServiceClient> {
        const where: ORM.ObjectQuery<Entities.ServiceClient> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.code) {
            where.code = ORMAdapter.applyStringFilter(filters.code);
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
        sort: Repositories.Mappers.ServiceClient.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.ServiceClient, P, F> = {},
    ): ORM.FindOptions<Entities.ServiceClient, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.ServiceClient>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
