declare namespace Unit.Queries.Session {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            sessionRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.Session.QueryContract["findUniqueOrThrow"]>;
                findMany: Jest.Mock<Repositories.Session.QueryContract["findMany"]>;
            };
            queries: globalThis.Queries.Session.Contract;
        };

        type Signature = () => Result;
    }
}
