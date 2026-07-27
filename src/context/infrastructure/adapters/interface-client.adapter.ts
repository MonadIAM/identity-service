import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class InterfaceClientAdapter implements Adapters.Contract<Entities.InterfaceClient, Adapters.InterfaceClient.Types> {
    public buildWhereORM(
        filters: Adapters.InterfaceClient.Filters,
        basic: ORM.ObjectQuery<Entities.InterfaceClient> = {},
    ): ORM.ObjectQuery<Entities.InterfaceClient> {
        const where: ORM.ObjectQuery<Entities.InterfaceClient> = basic;

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
        sort: Adapters.InterfaceClient.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.InterfaceClient, P, F> = {},
    ): ORM.FindOptions<Entities.InterfaceClient, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.InterfaceClient>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
