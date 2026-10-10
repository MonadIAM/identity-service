declare namespace Queries.AuditLog {
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
            filters: Repositories.Mappers.AuditLog.Filters;
            sort: Repositories.Mappers.AuditLog.Sort;
            pagination: Pagination;
        };

        type Result = Promise<[SystemEntities.AuditLog[], number]>;

        type Signature = (props: Props) => Result;
    }
}
