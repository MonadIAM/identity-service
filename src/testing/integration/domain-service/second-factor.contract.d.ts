import type { SecondFactorRepository } from "~context/infrastructure/repositories/second-factor.repository";
import type { IdentifierRepository } from "~context/infrastructure/repositories/identifier.repository";
import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { SecondFactorService } from "~context/domain/services/second-factor.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace SecondFactor {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly secondFactorSecret: SecondFactorSecret.Signature;
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                    readonly hashing: Hashing.Signature;
                    readonly totp: TOTP.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly repositories: Repositories.Context;
                        readonly services: {
                            readonly secret: Integration.ServiceMocks.SecondFactorSecret;
                            readonly hashing: Integration.ServiceMocks.Hashing;
                            readonly totp: Integration.ServiceMocks.TOTP;
                        };
                        readonly secondFactorService: SecondFactorService;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly secondFactors: SecondFactorRepository;
                        readonly identifiers: IdentifierRepository;
                        readonly accounts: AccountRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace SecondFactorSecret {
                    type Signature = Integration.ServiceMockBank.SecondFactorSecret.Signature;
                }

                namespace Hashing {
                    type Signature = Integration.ServiceMockBank.Hashing.Signature;
                }

                namespace TOTP {
                    type Signature = Integration.ServiceMockBank.TOTP.Signature;
                }
            }
        }
    }
}
