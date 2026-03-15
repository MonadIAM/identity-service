import { EntityManager, FilterQuery, FindOptions, QueryOrder, Loaded } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { Notification as NotificationEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Notification {
            type Entity = NotificationEntity;

            interface Contract {
                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                find: <P extends string = never, F extends string = "*">(
                    props: Find<P, F>,
                ) => Promise<Loaded<Entity, P, F>[]>;

                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;

                markAsRead: (props: MarkAsRead) => Promise<number>;
            }

            type FindUnique<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindUniqueOrThrow<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type Find<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindMany<P extends string, F extends string> =
                | {
                      transaction?: EntityManager;
                      options?: FindOptions<Entity, P, F>;
                      where: FilterQuery<Entity>;
                  }
                | {
                      options?: FindOptions<Entity, P, F>;
                      pagination: Pagination;
                      filters: Filters;
                      sort: Sort;
                  };

            type MarkAsRead = {
                transaction?: EntityManager;
                account: string;
                id?: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                category?: StringFilterDTO;
                source?: StringFilterDTO;
                createdAt?: OrdinalFilterDTO<Date>;
                readAt?: OrdinalFilterDTO<Date>;
                account?: LinkFilterDTO;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };
        }
    }
}
