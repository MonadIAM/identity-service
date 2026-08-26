import { QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace MembershipHistory {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findMany: FindMany.Signature;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Repositories.Mappers.MembershipHistory.DefaultFilters;
                    sort: Repositories.Mappers.MembershipHistory.Sort;
                    pagination: Pagination;
                    actor: string;
                };

                type CommonProps = {
                    mode: QueryMode.COMMON;
                    filters: Repositories.Mappers.MembershipHistory.CommonFilters;
                    sort: Repositories.Mappers.MembershipHistory.Sort;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Repositories.Mappers.MembershipHistory.ManageFilters;
                    sort: Repositories.Mappers.MembershipHistory.Sort;
                    pagination: Pagination;
                };

                type Props = DefaultProps | CommonProps | ManageProps;

                type Result = Promise<[Entities.MembershipHistory[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
