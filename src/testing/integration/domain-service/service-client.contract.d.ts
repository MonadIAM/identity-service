import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Integration.Domain.ServiceClient {
        type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
            config: Config.Signature;
        }

        namespace Service {
            type Context = {
                serviceClientService: Services.ServiceClient.Contract;
                repositories: Repositories.Context;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                serviceClients: globalThis.Repositories.ServiceClient.Contract;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Config {
            type Signature = () => ConfigService;
        }
    }
}
