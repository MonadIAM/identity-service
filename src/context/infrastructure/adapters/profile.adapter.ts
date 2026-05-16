import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class ProfileAdapter implements Adapters.Contract<Entities.Profile, Adapters.Profile.Types> {
    public buildWhereORM(
        _filters: Adapters.Profile.Filters,
        basic: ObjectQuery<Entities.Profile> = {},
    ): ObjectQuery<Entities.Profile> {
        const where: ObjectQuery<Entities.Profile> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Profile.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Profile, P, F> = {},
    ): FindOptions<Entities.Profile, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Profile>(sort, { updatedAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
