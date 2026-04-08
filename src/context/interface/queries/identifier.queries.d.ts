import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Identifier {
            type Entity = Repositories.Identifier.Entity;

            interface Contract {
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindUnique = {
                view: ResponseViewType;
                identifier: string;
            };

            type FindMany = {
                filters: Repositories.Identifier.Filters;
                sort: Repositories.Identifier.Sort;
                view: ResponseViewType;
                pagination: Pagination;
            };

            type GetLookupList = {
                pagination: Pagination;
                account: string;
                term: string;
            };
        }
    }
}
