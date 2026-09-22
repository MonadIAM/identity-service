import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Unit.Queries.OAuth {
        interface Contract extends Domain.Core.Contract {
            queries: Queries.Signature;
        }

        namespace Queries {
            type Result = {
                accountRepository: {
                    findUniqueOrThrow: Jest.Mock<Repositories.Account.QueryContract["findUniqueOrThrow"]>;
                };
                jwtService: Jest.Mocked<Pick<CommonServices.JWT.PublicContract, "computePairwiseSubject">>;
                queries: globalThis.Queries.OAuth.Contract;
                configService: ConfigService;
            };

            type Signature = () => Result;
        }
    }
}
