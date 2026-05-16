import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";

export class SessionAdapter implements Adapters.Contract<Entities.Session, Adapters.Session.Types> {
    public buildWhereORM(
        _filters: Adapters.Session.Filters,
        basic: ObjectQuery<Entities.Session> = {},
    ): ObjectQuery<Entities.Session> {
        const where: ObjectQuery<Entities.Session> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Session.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Session, P, F> = {},
    ): FindOptions<Entities.Session, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Session>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
