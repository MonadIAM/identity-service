import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class SessionMapper implements Repositories.Mappers.Contract<Entities.Session, Repositories.Mappers.Session.Types> {
    public buildWhereORM(
        _filters: Repositories.Mappers.Session.Filters,
        basic: ORM.ObjectQuery<Entities.Session> = {},
    ): ORM.ObjectQuery<Entities.Session> {
        const where: ORM.ObjectQuery<Entities.Session> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Session.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Session, P, F> = {},
    ): ORM.FindOptions<Entities.Session, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Session>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
