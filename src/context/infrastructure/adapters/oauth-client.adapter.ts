import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class OAuthClientAdapter implements Adapters.Contract<Entities.OAuthClient, Adapters.OAuthClient.Types> {
    public buildWhereORM(
        filters: Adapters.OAuthClient.Filters,
        basic: ObjectQuery<Entities.OAuthClient> = {},
    ): ObjectQuery<Entities.OAuthClient> {
        const where: ObjectQuery<Entities.OAuthClient> = basic;

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
        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.OAuthClient.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.OAuthClient, P, F> = {},
    ): FindOptions<Entities.OAuthClient, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.OAuthClient>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
