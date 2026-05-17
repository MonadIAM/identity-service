declare namespace Queries {
    namespace AuditLog {
        interface ControllerContract {
            findUnique: (props: FindUnique.Props) => FindUnique.Result;
            findMany: (props: FindMany.Props) => FindMany.Result;
        }

        interface Contract extends ControllerContract {}

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Promise<Entities.AuditLog>;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.AuditLog.Filters;
                sort: Adapters.AuditLog.Sort;
                pagination: Pagination;
            };

            type Result = Promise<[Entities.AuditLog[], number]>;
        }
    }
}
