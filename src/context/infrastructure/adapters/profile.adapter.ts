import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class ProfileAdapter implements Adapters.Contract<Entities.Profile, Adapters.Profile.Types> {
    public buildWhereORM(
        _filters: Adapters.Profile.Filters,
        basic: ORM.ObjectQuery<Entities.Profile> = {},
    ): ORM.ObjectQuery<Entities.Profile> {
        const where: ORM.ObjectQuery<Entities.Profile> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Profile.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Profile, P, F> = {},
    ): ORM.FindOptions<Entities.Profile, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Profile>(sort, { updatedAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
