import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace ServiceClient {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
            }

            namespace FindUnique {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    view: ResponseViewType;
                    application: string;
                    client: string;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    client: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.ServiceClient>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type DefaultProps = {
                    filters: Adapters.ServiceClient.DefaultFilters;
                    sort: Adapters.ServiceClient.Sort;
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    view: ResponseViewType;
                    application: string;
                    realm: string;
                };

                type ManageProps = {
                    filters: Adapters.ServiceClient.ManageFilters;
                    sort: Adapters.ServiceClient.Sort;
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.ServiceClient[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
