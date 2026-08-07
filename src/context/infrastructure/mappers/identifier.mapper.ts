import { QueryOrder } from "@mikro-orm/postgresql";

import { ORMAdapter } from "~infrastructure/database/utils";
import { IdentifierType } from "~context/enums";

export class IdentifierMapper {
    public buildWhereORM(
        filters: Repositories.Mappers.Identifier.Filters,
        basic: ORM.ObjectQuery<Entities.Identifier> = {},
    ): ORM.ObjectQuery<Entities.Identifier> {
        const where: ORM.ObjectQuery<Entities.Identifier> = basic;

        if (filters.id) {
            where.id = ORMAdapter.applyStringFilter(filters.id);
        }
        if (filters.provider) {
            where.provider = ORMAdapter.applyStringFilter(filters.provider);
        }

        if (filters.email) {
            where.type = IdentifierType.EMAIL;
            where.value = ORMAdapter.applyStringFilter(filters.email);
        }
        if (filters.phone) {
            where.type = IdentifierType.PHONE;
            where.value = ORMAdapter.applyStringFilter(filters.phone);
        }

        if (filters.isVerified !== undefined) {
            where.isVerified = { $eq: filters.isVerified };
        }
        if (filters.isPublicContact !== undefined) {
            where.isPublicContact = { $eq: filters.isPublicContact };
        }

        if (filters.createdAt) {
            where.createdAt = ORMAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.verifiedAt) {
            where.verifiedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.verifiedAt);
        }
        if (filters.lastUsedAt) {
            where.lastUsedAt = ORMAdapter.applyOrdinalFilter<Date>(filters.lastUsedAt);
        }

        if (filters.account) {
            where.account = { id: ORMAdapter.applyStringFilter(filters.account) };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Mappers.Identifier.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Identifier, P, F> = {},
    ): ORM.FindOptions<Entities.Identifier, P, F> {
        return {
            ...basic,
            orderBy: ORMAdapter.orderBy<Entities.Identifier>(sort, { createdAt: QueryOrder.ASC }),
            ...ORMAdapter.pagination(pagination),
        };
    }
}
