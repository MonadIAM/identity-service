import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { AccountSubject, AccountStatus, IdentifierType } from "~context/enums";
import { MikroAdapter } from "~infrastructure/database/utils";

export class AccountAdapter implements Adapters.Contract<Entities.Account, Adapters.Account.Types> {
    public buildWhereORM(
        filters: Adapters.Account.Filters,
        basic: ObjectQuery<Entities.Account> = {},
    ): ObjectQuery<Entities.Account> {
        const where: ObjectQuery<Entities.Account> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.subject) {
            where.subject = MikroAdapter.applyStringFilter<AccountSubject>(filters.subject);
        }
        if (filters.status) {
            where.status = MikroAdapter.applyStringFilter<AccountStatus>(filters.status);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }

        if (filters.name) {
            where.profile = { displayName: MikroAdapter.applyStringFilter(filters.name) };
        }

        if (filters.email && filters.phone) {
            where.$and = [
                {
                    identifiers: {
                        type: IdentifierType.EMAIL,
                        value: MikroAdapter.applyStringFilter(filters.email),
                    },
                },
                {
                    identifiers: {
                        type: IdentifierType.PHONE,
                        value: MikroAdapter.applyStringFilter(filters.phone),
                    },
                },
            ];
        } else if (filters.email) {
            where.identifiers = {
                type: IdentifierType.EMAIL,
                value: MikroAdapter.applyStringFilter(filters.email),
            };
        } else if (filters.phone) {
            where.identifiers = {
                type: IdentifierType.PHONE,
                value: MikroAdapter.applyStringFilter(filters.phone),
            };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Account.Sort,
        pagination: Pagination,
        basic: FindOptions<Entities.Account, P, F> = {},
    ): FindOptions<Entities.Account, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Account>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
