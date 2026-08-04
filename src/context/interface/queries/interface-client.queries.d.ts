import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace InterfaceClient {
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

                type Result = Promise<Entities.InterfaceClient>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type DefaultProps = {
                    filters: Adapters.InterfaceClient.DefaultFilters;
                    sort: Adapters.InterfaceClient.Sort;
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    view: ResponseViewType;
                    application: string;
                    realm: string;
                };

                type ManageProps = {
                    filters: Adapters.InterfaceClient.ManageFilters;
                    sort: Adapters.InterfaceClient.Sort;
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.InterfaceClient[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
