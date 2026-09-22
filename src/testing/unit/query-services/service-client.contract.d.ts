declare namespace Unit.Queries.ServiceClient {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.ServiceClient.Contract;
            serviceClientRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.ServiceClient.QueryContract["findUniqueOrThrow"]>;
                findMany: Jest.Mock<Repositories.ServiceClient.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
