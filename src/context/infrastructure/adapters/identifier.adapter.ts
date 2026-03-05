import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { MikroAdapter } from "~infrastructure/database/utils";
import { Identifier } from "~context/domain/entities";
import { IdentifierType } from "~context/enums";

export class IdentifierAdapter {
    protected buildWhereORM(
        filters: Repositories.Identifier.Filters,
        basic: ObjectQuery<Identifier> = {},
    ): ObjectQuery<Identifier> {
        const where: ObjectQuery<Identifier> = basic;

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
        if (filters.usableAs2FA !== undefined) {
            where.usableAs2FA = { $eq: filters.usableAs2FA };
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

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Identifier.Sort,
        pagination: Pagination,
        basic: FindOptions<Identifier, P, F> = {},
    ): FindOptions<Identifier, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Identifier>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
