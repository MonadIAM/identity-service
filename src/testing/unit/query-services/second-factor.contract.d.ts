import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace SecondFactorQueries {
                interface Contract extends CommandCore.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = Promise<
                        CommandCore.Execution.Result & {
                            readonly queries: globalThis.Queries.SecondFactor.Contract;
                            readonly secondFactorRepository: {
                                readonly findMany: jest.Mock<Repositories.SecondFactor.QueryContract["findMany"]>;
                                readonly findUnique: jest.Mock<Repositories.SecondFactor.QueryContract["findUnique"]>;
                            };
                            readonly secondFactorSecretService: {
                                readonly resolve: jest.Mock<
                                    InfrastructureServices.SecondFactorSecret.PublicContract["resolve"]
                                >;
                            };
                            readonly totpService: {
                                readonly createURI: jest.Mock<CommonServices.TOTP.PublicContract["createURI"]>;
                            };
                        }
                    >;

                    type Signature = () => Result;
                }
            }
        }
    }
}
