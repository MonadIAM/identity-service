declare namespace Unit.Queries.Identifier {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.Identifier.Contract;
            identifierRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.Identifier.QueryContract["findUniqueOrThrow"]>;
                getLookupList: Jest.Mock<Repositories.Identifier.QueryContract["getLookupList"]>;
                findMany: Jest.Mock<Repositories.Identifier.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
