import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace ChangeLogQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.ChangeLog.Contract;
                        readonly changeLogRepository: {
                            readonly findUniqueOrThrow: jest.Mock<
                                Repositories.ChangeLog.QueryContract["findUniqueOrThrow"]
                            >;
                            readonly findMany: jest.Mock<Repositories.ChangeLog.QueryContract["findMany"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
