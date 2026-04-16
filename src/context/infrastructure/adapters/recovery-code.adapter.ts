import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { RecoveryCode } from "~context/domain/entities";

export class RecoveryCodeAdapter implements Adapters.Contract<RecoveryCode, Adapters.RecoveryCode.Types> {
    public buildWhereORM(
        _filters: Adapters.RecoveryCode.Filters,
        basic: ObjectQuery<RecoveryCode> = {},
    ): ObjectQuery<RecoveryCode> {
        const where: ObjectQuery<RecoveryCode> = basic;

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.RecoveryCode.Sort,
        pagination: Pagination,
        basic: FindOptions<RecoveryCode, P, F> = {},
    ): FindOptions<RecoveryCode, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<RecoveryCode>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
