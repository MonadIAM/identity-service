import { QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { IdentifierType } from "~context/enums";

export class IdentifierAdapter {
    public buildWhereORM(
        filters: Adapters.Identifier.Filters,
        basic: ORM.ObjectQuery<Entities.Identifier> = {},
    ): ORM.ObjectQuery<Entities.Identifier> {
        const where: ORM.ObjectQuery<Entities.Identifier> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.provider) {
            where.provider = MikroAdapter.applyStringFilter(filters.provider);
        }

        if (filters.email) {
            where.type = IdentifierType.EMAIL;
            where.value = MikroAdapter.applyStringFilter(filters.email);
        }
        if (filters.phone) {
            where.type = IdentifierType.PHONE;
            where.value = MikroAdapter.applyStringFilter(filters.phone);
        }

        if (filters.isVerified !== undefined) {
            where.isVerified = { $eq: filters.isVerified };
        }
        if (filters.isPublicContact !== undefined) {
            where.isPublicContact = { $eq: filters.isPublicContact };
        }
        if (filters.receiveNotifications !== undefined) {
            where.receiveNotifications = { $eq: filters.receiveNotifications };
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.verifiedAt) {
            where.verifiedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.verifiedAt);
        }
        if (filters.lastUsedAt) {
            where.lastUsedAt = MikroAdapter.applyOrdinalFilter<Date>(filters.lastUsedAt);
        }

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        return where;
    }

    public buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Adapters.Identifier.Sort,
        pagination: Pagination,
        basic: ORM.FindOptions<Entities.Identifier, P, F> = {},
    ): ORM.FindOptions<Entities.Identifier, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Entities.Identifier>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
