import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class ProfileMapper implements Repositories.Mappers.Contract<Entities.Profile, Repositories.Mappers.Profile.Types> {
    public buildWhereORM(
        _filters: Repositories.Mappers.Profile.Filters,
        basic: ORM.ObjectQuery<Entities.Profile> = {},
    ): ORM.ObjectQuery<Entities.Profile> {
        const where: ORM.ObjectQuery<Entities.Profile> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Profile.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Profile, P, F> = {},
    ): ORM.FindOptions<Entities.Profile, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Profile>(sort, { updatedAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
