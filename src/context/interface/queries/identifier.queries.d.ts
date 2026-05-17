import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Identifier {
            interface ControllerContract {
                getLookupList: (props: GetLookupList.Props) => GetLookupList.Result;
                findUnique: (props: FindUnique.Props) => FindUnique.Result;
                findMany: (props: FindMany.Props) => FindMany.Result;
            }

            interface Contract extends ControllerContract {}

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    account: string;
                    term: string;
                };

                type Result = Promise<[Entities.Identifier[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    identifier: string;
                };

                type Result = Promise<Entities.Identifier>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Identifier.Filters;
                    sort: Adapters.Identifier.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Result = Promise<[Entities.Identifier[], number]>;
            }
        }
    }
}
