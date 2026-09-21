import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RecoveryCodeQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.RecoveryCode.Contract;
                        readonly recoveryCodeRepository: {
                            readonly getStatus: jest.Mock<Repositories.RecoveryCode.QueryContract["getStatus"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
