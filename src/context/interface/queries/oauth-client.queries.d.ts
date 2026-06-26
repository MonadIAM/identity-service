import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace OAuthClient {
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
                    client: string;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    client: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.OAuthClient>;
            }

            namespace FindMany {
                type DefaultProps = {
                    filters: Adapters.OAuthClient.DefaultFilters;
                    sort: Adapters.OAuthClient.Sort;
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    view: ResponseViewType;
                    realm: string;
                };

                type ManageProps = {
                    filters: Adapters.OAuthClient.ManageFilters;
                    sort: Adapters.OAuthClient.Sort;
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.OAuthClient[], number]>;
            }
        }
    }
}
