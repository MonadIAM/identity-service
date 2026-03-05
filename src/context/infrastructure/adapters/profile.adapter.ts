import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Profile } from "~context/domain/entities";

export class ProfileAdapter {
    protected buildWhereORM(filters: Repositories.Profile.Filters, basic: ObjectQuery<Profile> = {}): ObjectQuery<Profile> {
        const where: ObjectQuery<Profile> = basic;

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        if (filters.displayName) {
            where.displayName = MikroAdapter.applyStringFilter(filters.displayName);
        }
        if (filters.timeZone) {
            where.timeZone = MikroAdapter.applyStringFilter(filters.timeZone);
        }
        if (filters.locale) {
            where.locale = MikroAdapter.applyStringFilter(filters.locale);
        }

        if (filters.updatedAt) {
            where.updatedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Profile.Sort,
        pagination: Pagination,
        basic: FindOptions<Profile, P, F> = {},
    ): FindOptions<Profile, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Profile>(sort, { account: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
