import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Application {
            interface ControllerContract {
                findUnique(props: FindUnique.DefaultProps): FindUnique.Result;
                findUnique(props: FindUnique.ManageProps): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
            }

            interface Contract extends ControllerContract {}

            namespace FindUnique {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    view: ResponseViewType;
                    application: string;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    application: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.Application>;
            }

            namespace FindMany {
                type DefaultProps = {
                    filters: Adapters.Application.DefaultFilters;
                    sort: Adapters.Application.Sort;
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    view: ResponseViewType;
                    realm: string;
                };

                type ManageProps = {
                    filters: Adapters.Application.ManageFilters;
                    sort: Adapters.Application.Sort;
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.Application[], number]>;
            }
        }
    }
}
