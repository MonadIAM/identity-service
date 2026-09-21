import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace ServiceClientQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.ServiceClient.Contract;
                        readonly serviceClientRepository: {
                            readonly findMany: jest.Mock<Repositories.ServiceClient.QueryContract["findMany"]>;
                            readonly findUniqueOrThrow: jest.Mock<
                                Repositories.ServiceClient.QueryContract["findUniqueOrThrow"]
                            >;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
