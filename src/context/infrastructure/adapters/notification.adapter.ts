import { FindOptions, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { NotificationCategory } from "~context/enums";
import { MikroAdapter } from "~infrastructure/database/utils";
import { Notification } from "~context/domain/entities";

export class NotificationAdapter {
    protected buildWhereORM(
        filters: Repositories.Notification.Filters,
        basic: ObjectQuery<Notification> = {},
    ): ObjectQuery<Notification> {
        const where: ObjectQuery<Notification> = basic;

        if (filters.id) {
            where.id = MikroAdapter.applyStringFilter(filters.id);
        }
        if (filters.category) {
            where.category = MikroAdapter.applyStringFilter<NotificationCategory>(filters.category);
        }
        if (filters.source) {
            where.source = MikroAdapter.applyStringFilter(filters.source);
        }

        if (filters.createdAt) {
            where.createdAt = MikroAdapter.applyOrdinalFilter<Date>(filters.createdAt);
        }
        if (filters.readAt) {
            where.readAt = MikroAdapter.applyOrdinalFilter<Date>(filters.readAt);
        }

        if (filters.account) {
            where.account = { id: MikroAdapter.applyStringFilter(filters.account) };
        }

        return where;
    }

    protected buildOptionsORM<P extends string = never, F extends string = "*">(
        sort: Repositories.Notification.Sort,
        pagination: Pagination,
        basic: FindOptions<Notification, P, F> = {},
    ): FindOptions<Notification, P, F> {
        return {
            ...basic,
            orderBy: MikroAdapter.orderBy<Notification>(sort, { createdAt: QueryOrder.ASC }),
            ...MikroAdapter.pagination(pagination),
        };
    }
}
