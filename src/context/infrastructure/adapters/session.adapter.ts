import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Session } from "~context/domain/entities";

export class SessionAdapter implements Adapters.Contract<Session, Adapters.Session.Types> {
    public buildWhereORM(_filters: Adapters.Session.Filters, basic: ObjectQuery<Session> = {}): ObjectQuery<Session> {
        const where: ObjectQuery<Session> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Session.Sort,
        pagination: Pagination,
        basic: FindOptions<Session, P, F> = {},
    ): FindOptions<Session, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Session>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
