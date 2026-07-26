declare namespace Queries {
    namespace ChangeLog {
        interface ControllerContract {
            findUnique(props: FindUnique.Props): FindUnique.Result;
            findMany(props: FindMany.Props): FindMany.Result;
        }

        interface Contract extends ControllerContract {}

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Promise<SystemEntities.ChangeLog>;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.ChangeLog.Filters;
                sort: Adapters.ChangeLog.Sort;
                pagination: Pagination;
            };

            type Result = Promise<[SystemEntities.ChangeLog[], number]>;
        }
    }
}
