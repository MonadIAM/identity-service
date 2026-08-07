import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Account {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
                findMe: FindMe.Signature;
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

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type ManageProps = {
                    filters: Repositories.Mappers.Account.ManageFilters;
                    sort: Repositories.Mappers.Account.Sort;
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type DefaultProps = {
                    filters: Repositories.Mappers.Account.DefaultFilters;
                    sort: Repositories.Mappers.Account.Sort;
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    view: ResponseViewType;
                    realm: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.Account[], number]>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMe {
                type Props = {
                    view: ResponseViewType;
                    account: string;
                };

                type Result = Promise<Entities.Account>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
