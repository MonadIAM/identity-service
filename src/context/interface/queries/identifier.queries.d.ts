import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Identifier {
            interface ControllerContract {
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
                findUnique(props: FindUnique.DefaultProps): FindUnique.Result;
                findUnique(props: FindUnique.ManageProps): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
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
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    view: ResponseViewType;
                    identifier: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    identifier: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.Identifier>;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Identifier.DefaultFilters;
                    sort: Adapters.Identifier.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Identifier.ManageFilters;
                    sort: Adapters.Identifier.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.Identifier[], number]>;
            }
        }
    }
}
