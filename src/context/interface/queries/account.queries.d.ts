import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Account {
            type Entity = Repositories.Account.Entity;

            interface Contract {
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    account: string;
                };

                type Result = Entity;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Account.Filters;
                    sort: Adapters.Account.Sort;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Result = [Entity[], number];
            }
        }
    }
}
