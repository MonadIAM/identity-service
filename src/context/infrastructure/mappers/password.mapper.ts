import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class PasswordMapper implements Repositories.Mappers.Contract<
    Entities.Password,
    Repositories.Mappers.Password.Types
> {
    public buildWhereORM(
        _filters: Repositories.Mappers.Password.Filters,
        basic: ORM.ObjectQuery<Entities.Password> = {},
    ): ORM.ObjectQuery<Entities.Password> {
        const where: ORM.ObjectQuery<Entities.Password> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Password.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Password, P, F> = {},
    ): ORM.FindOptions<Entities.Password, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Password>(sort, { setAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
