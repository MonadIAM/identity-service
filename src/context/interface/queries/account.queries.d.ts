import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Account {
            type Entity = Repositories.Account.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindUnique = {
                view: ResponseViewType;
                account: string;
            };

            type FindMany = {
                filters: Repositories.Account.Filters;
                sort: Repositories.Account.Sort;
                pagination: Pagination;
                view: ResponseViewType;
            };
        }
    }
}
