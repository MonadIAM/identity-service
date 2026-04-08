import { EntityManager, FilterQuery, FindOptions, QueryOrder, Loaded } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { Identifier as IdentifierEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Identifier {
            type Entity = IdentifierEntity;

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

                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;

                isLastVerifiedIdentifier: (props: IsLastVerifiedIdentifier) => Promise<boolean>;
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
                account: string;
                term: string;
            };

            type IsLastVerifiedIdentifier = {
                transaction?: EntityManager;
                identifier: string;
                account: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                email?: StringFilterDTO;
                phone?: StringFilterDTO;
                provider?: StringFilterDTO;
                account?: LinkFilterDTO;
                isVerified?: boolean;
                isPublicContact?: boolean;
                receiveNotifications?: boolean;
                createdAt?: OrdinalFilterDTO<Date>;
                verifiedAt?: OrdinalFilterDTO<Date>;
                lastUsedAt?: OrdinalFilterDTO<Date>;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };
        }
    }
}
