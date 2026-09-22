declare namespace Unit.Queries.InterfaceClient {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.InterfaceClient.Contract;
            interfaceClientRepository: {
                findUniqueOrThrow: Jest.Mock<Repositories.InterfaceClient.QueryContract["findUniqueOrThrow"]>;
                findMany: Jest.Mock<Repositories.InterfaceClient.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
