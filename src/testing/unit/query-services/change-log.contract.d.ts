declare namespace Unit.Queries.ChangeLog {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.ChangeLog.Contract;
            changeLogRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.ChangeLog.QueryContract["findUniqueOrThrow"]>;
                findMany: Jest.Mock<Repositories.ChangeLog.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
