import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.Account {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            getSecurity: GetSecurity.Signature;
            findUnique: FindUnique.Signature;
            findMany: FindMany.Signature;
            findMe: FindMe.Signature;
        }

        namespace GetSecurity {
            type Props = {
                account: string;
            };

            type Result = Promise<{
                canConfirmByEmail: boolean;
                hasSecondFactor: boolean;
                hasPassword: boolean;
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace FindUnique {
            type Props = {
                mode: QueryMode.MANAGE;
                view: ResponseViewType;
                account: string;
            };

            type Result = Promise<Entities.Account>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type Props = {
                filters: Repositories.Mappers.Account.Filters;
                sort: Repositories.Mappers.Account.Sort;
                mode: QueryMode.MANAGE;
                pagination: Pagination;
                view: ResponseViewType;
            };

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
