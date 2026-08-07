import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";

export class RecoveryCodeMapper implements Repositories.Mappers.Contract<
    Entities.RecoveryCode,
    Repositories.Mappers.RecoveryCode.Types
> {
    public buildWhereORM(
        _filters: Repositories.Mappers.RecoveryCode.Filters,
        basic: ORM.ObjectQuery<Entities.RecoveryCode> = {},
    ): ORM.ObjectQuery<Entities.RecoveryCode> {
        const where: ORM.ObjectQuery<Entities.RecoveryCode> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.RecoveryCode.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.RecoveryCode, P, F> = {},
    ): ORM.FindOptions<Entities.RecoveryCode, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.RecoveryCode>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
