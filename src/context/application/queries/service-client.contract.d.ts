import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.ServiceClient {
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

            type Result = Promise<Entities.ServiceClient>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type DefaultProps = {
                filters: Repositories.Mappers.ServiceClient.DefaultFilters;
                sort: Repositories.Mappers.ServiceClient.Sort;
                mode: QueryMode.DEFAULT;
                pagination: Pagination;
                view: ResponseViewType;
                realm: string;
            };

            type ManageProps = {
                filters: Repositories.Mappers.ServiceClient.ManageFilters;
                sort: Repositories.Mappers.ServiceClient.Sort;
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
