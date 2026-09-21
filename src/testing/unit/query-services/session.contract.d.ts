import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace SessionQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly sessionRepository: {
                            readonly findUniqueOrThrow: jest.Mock<Repositories.Session.QueryContract["findUniqueOrThrow"]>;
                            readonly findMany: jest.Mock<Repositories.Session.QueryContract["findMany"]>;
                        };
                        readonly queries: globalThis.Queries.Session.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
