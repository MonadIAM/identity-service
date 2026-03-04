import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { AccountSubject, AccountStatus, IdentifierType } from "~context/enums";
import { MikroAdapter } from "~infrastructure/database/utils";
import { Account } from "~context/domain/entities";

export class AccountAdapter {
    protected buildWhereORM(filters: Repositories.Account.Filters, basic: ObjectQuery<Account> = {}): ObjectQuery<Account> {
        const where: ObjectQuery<Account> = basic;

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

        if (filters.is2FAEnforced !== undefined) {
            where.is2FAEnforced = { $eq: filters.is2FAEnforced };
        }

        if (filters.displayName) {
            where.profile = { displayName: MikroAdapter.applyStringFilter(filters.displayName) };
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

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Account.Sort,
        pagination: Pagination,
        basic: FindOptions<Account, P, F> = {},
    ): FindOptions<Account, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Account>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
