import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Integration.Domain.Password {
        type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
            hashing: Hashing.Signature;
            config: Config.Signature;
        }

        namespace Service {
            type Context = {
                repositories: Repositories.Context;
                passwordService: Services.Password.Contract;
                services: {
                    hashing: Integration.ServiceMocks.Hashing;
                };
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                passwordHistory: globalThis.Repositories.PasswordHistory.Contract;
                identifiers: globalThis.Repositories.Identifier.Contract;
                accounts: globalThis.Repositories.Account.Contract;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Config {
            type Signature = () => ConfigService;
        }

        namespace Hashing {
            type Signature = Integration.ServiceMockBank.Hashing.Signature;
        }
    }
}
