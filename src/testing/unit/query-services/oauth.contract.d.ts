import type { ConfigService } from "@nestjs/config";
import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace OAuthQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly accountRepository: {
                            readonly findUniqueOrThrow: jest.Mock<Repositories.Account.QueryContract["findUniqueOrThrow"]>;
                        };
                        readonly jwtService: {
                            readonly computePairwiseSubject: jest.Mock<
                                CommonServices.JWT.PublicContract["computePairwiseSubject"]
                            >;
                        };
                        readonly queries: globalThis.Queries.OAuth.Contract;
                        readonly configService: ConfigService;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
