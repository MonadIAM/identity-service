import { QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace MembershipHistory {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
            }

            namespace FindUnique {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    membershipHistory: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    membershipHistory: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.MembershipHistory>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Repositories.Mappers.MembershipHistory.DefaultFilters;
                    sort: Repositories.Mappers.MembershipHistory.Sort;
                    pagination: Pagination;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Repositories.Mappers.MembershipHistory.ManageFilters;
                    sort: Repositories.Mappers.MembershipHistory.Sort;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.MembershipHistory[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
