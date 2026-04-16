import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Profile } from "~context/domain/entities";

export class ProfileAdapter implements Adapters.Contract<Profile, Adapters.Profile.Types> {
    public buildWhereORM(_filters: Adapters.Profile.Filters, basic: ObjectQuery<Profile> = {}): ObjectQuery<Profile> {
        const where: ObjectQuery<Profile> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Profile.Sort,
        pagination: Pagination,
        basic: FindOptions<Profile, P, F> = {},
    ): FindOptions<Profile, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Profile>(sort, { updatedAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
