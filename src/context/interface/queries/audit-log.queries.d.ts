declare namespace Queries {
    namespace AuditLog {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            findUnique: FindUnique.Signature;
            findMany: FindMany.Signature;
        }

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Promise<SystemEntities.AuditLog>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.AuditLog.Filters;
                sort: Adapters.AuditLog.Sort;
                pagination: Pagination;
            };

            type Result = Promise<[SystemEntities.AuditLog[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
