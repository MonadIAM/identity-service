declare namespace Unit.Queries.Account {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.Account.Contract;
            accountRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.Account.QueryContract["findUniqueOrThrow"]>;
                findMany: Jest.Mock<Repositories.Account.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
