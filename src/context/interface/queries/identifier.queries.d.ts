import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Identifier {
            type Entity = Repositories.Identifier.Entity;

            interface Contract {
                getLookupList: (props: GetLookupList.Props) => Promise<GetLookupList.Result>;
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    account: string;
                    term: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    identifier: string;
                };

                type Result = Entity;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Identifier.Filters;
                    sort: Adapters.Identifier.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Result = [Entity[], number];
            }
        }
    }
}
