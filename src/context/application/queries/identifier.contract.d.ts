import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.Identifier {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            getLookupList: GetLookupList.Signature;
            findUnique: FindUnique.Signature;
            findMany: FindMany.Signature;
        }

        namespace GetLookupList {
            type Props = {
                pagination: Pagination;
                account: string;
                term: string;
            };

            type Result = Promise<[Entities.Identifier[], number]>;

            type Signature = (props: Props) => Result;
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

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type DefaultProps = {
                mode: QueryMode.DEFAULT;
                filters: Repositories.Mappers.Identifier.DefaultFilters;
                sort: Repositories.Mappers.Identifier.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                actor: string;
            };

            type ManageProps = {
                mode: QueryMode.MANAGE;
                filters: Repositories.Mappers.Identifier.ManageFilters;
                sort: Repositories.Mappers.Identifier.Sort;
                view: ResponseViewType;
                pagination: Pagination;
            };

            type Props = DefaultProps | ManageProps;

            type Result = Promise<[Entities.Identifier[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
