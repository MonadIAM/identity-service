import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace IdentifierQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.Identifier.Contract;
                        readonly identifierRepository: {
                            readonly getLookupList: jest.Mock<Repositories.Identifier.QueryContract["getLookupList"]>;
                            readonly findMany: jest.Mock<Repositories.Identifier.QueryContract["findMany"]>;
                            readonly findUniqueOrThrow: jest.Mock<
                                Repositories.Identifier.QueryContract["findUniqueOrThrow"]
                            >;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
