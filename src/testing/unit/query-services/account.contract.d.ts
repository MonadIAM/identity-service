import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace AccountQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.Account.Contract;
                        readonly accountRepository: {
                            readonly findUniqueOrThrow: jest.Mock<Repositories.Account.QueryContract["findUniqueOrThrow"]>;
                            readonly findMany: jest.Mock<Repositories.Account.QueryContract["findMany"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
