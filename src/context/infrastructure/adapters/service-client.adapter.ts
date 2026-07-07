import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class ServiceClientAdapter implements Adapters.Contract<Entities.ServiceClient, Adapters.ServiceClient.Types> {
    public buildWhereORM(
        filters: Adapters.ServiceClient.Filters,
        basic: ObjectQuery<Entities.ServiceClient> = {},
    ): ObjectQuery<Entities.ServiceClient> {
        const where: ObjectQuery<Entities.ServiceClient> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.name) {
            where.name = MikroAdapter.applyStringFilter(filters.name);
        }
        if (filters.application) {
            where.application = MikroAdapter.applyStringFilter(filters.application);
        }
        if (filters.isRevoked !== undefined) {
            where.isRevoked = filters.isRevoked;
        }
        if (filters.isApplicationRevoked !== undefined) {
            where.isApplicationRevoked = filters.isApplicationRevoked;
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
        sort: Adapters.ServiceClient.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.ServiceClient, P, F> = {},
    ): FindOptions<Entities.ServiceClient, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.ServiceClient>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
