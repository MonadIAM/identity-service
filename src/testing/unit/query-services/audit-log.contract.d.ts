declare namespace Unit.Queries.AuditLog {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.AuditLog.Contract;
            auditLogRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.AuditLog.QueryContract["findUniqueOrThrow"]>;
                findMany: Jest.Mock<Repositories.AuditLog.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
