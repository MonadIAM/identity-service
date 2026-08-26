import { QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace Membership {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findMany: FindMany.Signature;
            }

            namespace FindMany {
                type PersonalProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Repositories.Mappers.Membership.PersonalFilters;
                    sort: Repositories.Mappers.Membership.Sort;
                    pagination: Pagination;
                    actor: string;
                };

                type CommonProps = {
                    mode: QueryMode.COMMON;
                    filters: Repositories.Mappers.Membership.CommonFilters;
                    sort: Repositories.Mappers.Membership.Sort;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Repositories.Mappers.Membership.ManageFilters;
                    sort: Repositories.Mappers.Membership.Sort;
                    pagination: Pagination;
                };

                type Props = PersonalProps | CommonProps | ManageProps;

                type Result = Promise<[Entities.Membership[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
