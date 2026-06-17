import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Account {
            interface ControllerContract {
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
            }

            interface Contract extends ControllerContract {}

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    account: string;
                };

                type Result = Promise<Entities.Account>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Account.Filters;
                    sort: Adapters.Account.Sort;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Result = Promise<[Entities.Account[], number]>;
            }
        }
    }
}
