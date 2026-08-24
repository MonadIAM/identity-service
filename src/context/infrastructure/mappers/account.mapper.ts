import { QueryOrder } from "@mikro-orm/postgresql";

import { AccountSubject, AccountStatus, IdentifierType } from "~context/enums";
import { ORMAdapter } from "~infrastructure/database/utils";

export class AccountMapper implements Repositories.Mappers.Contract<Entities.Account, Repositories.Mappers.Account.Types> {
    public buildWhereORM(
        filters: Repositories.Mappers.Account.Filters,
        basic: ORM.ObjectQuery<Entities.Account> = {},
    ): ORM.ObjectQuery<Entities.Account> {
        const where: ORM.ObjectQuery<Entities.Account> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.subject) {
            where.subject = ORMAdapter.applyStringFilter<AccountSubject>(filters.subject);
        }
        if (filters.status) {
            where.status = ORMAdapter.applyStringFilter<AccountStatus>(filters.status);
        }

        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.updatedAt) {
            where.updatedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.updatedAt);
        }

        if (filters.realm) {
            where.memberships = { realm: ORMAdapter.applyStringFilter(filters.realm) };
        }

        if (filters.name) {
            where.profile = { displayName: ORMAdapter.applyStringFilter(filters.name) };
        }

        if (filters.email && filters.phone) {
            where.$and = [
                {
                    identifiers: {
                        type: IdentifierType.EMAIL,
                        identity: ORMAdapter.applyStringFilter(filters.email),
                    },
                },
                {
                    identifiers: {
                        type: IdentifierType.PHONE,
                        identity: ORMAdapter.applyStringFilter(filters.phone),
                    },
                },
            ];
        } else if (filters.email) {
            where.identifiers = {
                type: IdentifierType.EMAIL,
                identity: ORMAdapter.applyStringFilter(filters.email),
            };
        } else if (filters.phone) {
            where.identifiers = {
                type: IdentifierType.PHONE,
                identity: ORMAdapter.applyStringFilter(filters.phone),
            };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Account.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Account, P, F> = {},
    ): ORM.FindOptions<Entities.Account, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Account>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
