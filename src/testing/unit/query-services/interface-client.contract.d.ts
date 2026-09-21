import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace InterfaceClientQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.InterfaceClient.Contract;
                        readonly interfaceClientRepository: {
                            readonly findMany: jest.Mock<Repositories.InterfaceClient.QueryContract["findMany"]>;
                            readonly findUniqueOrThrow: jest.Mock<
                                Repositories.InterfaceClient.QueryContract["findUniqueOrThrow"]
                            >;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
