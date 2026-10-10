import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.InterfaceClient {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            findUnique: FindUnique.Signature;
            findMany: FindMany.Signature;
        }

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

            type Result = Promise<Entities.InterfaceClient>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type DefaultProps = {
                filters: Repositories.Mappers.InterfaceClient.DefaultFilters;
                sort: Repositories.Mappers.InterfaceClient.Sort;
                mode: QueryMode.DEFAULT;
                pagination: Pagination;
                view: ResponseViewType;
                realm: string;
            };

            type ManageProps = {
                filters: Repositories.Mappers.InterfaceClient.ManageFilters;
                sort: Repositories.Mappers.InterfaceClient.Sort;
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
