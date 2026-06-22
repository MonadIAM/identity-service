import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Account {
            interface ControllerContract {
                findUnique(props: FindUnique.DefaultProps): FindUnique.Result;
                findUnique(props: FindUnique.ManageProps): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
                findMe(props: FindMe.Props): FindMe.Result;
            }

            interface Contract extends ControllerContract {}

            namespace FindMe {
                type Props = {
                    view: ResponseViewType;
                    account: string;
                };

                type Result = Promise<Entities.Account>;
            }

            namespace FindUnique {
                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    account: string;
                };

                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    view: ResponseViewType;
                    account: string;
                    realm: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.Account>;
            }

            namespace FindMany {
                type ManageProps = {
                    filters: Adapters.Account.ManageFilters;
                    sort: Adapters.Account.Sort;
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type DefaultProps = {
                    filters: Adapters.Account.DefaultFilters;
                    sort: Adapters.Account.Sort;
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    view: ResponseViewType;
                    realm: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.Account[], number]>;
            }
        }
    }
}
