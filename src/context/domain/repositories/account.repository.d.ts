import { EntityManager, FilterQuery, FindOptions, QueryOrder, Loaded } from "@mikro-orm/postgresql";

import { OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { Account as AccountEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Account {
            type Entity = AccountEntity;

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

            type GetLookupList = {
                pagination: Pagination;
                term: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                is2FAEnforced?: boolean;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                subject?: StringFilterDTO;
                status?: StringFilterDTO;
                email?: StringFilterDTO;
                phone?: StringFilterDTO;
                name?: StringFilterDTO;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };
        }
    }
}
