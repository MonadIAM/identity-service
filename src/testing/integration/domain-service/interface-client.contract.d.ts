import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Integration.Domain.InterfaceClient {
        type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
            config: Config.Signature;
        }

        namespace Service {
            type Context = {
                interfaceClientService: Services.InterfaceClient.Contract;
                repositories: Repositories.Context;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Repositories {
            type Context = {
                interfaceClients: globalThis.Repositories.InterfaceClient.Contract;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Config {
            type Signature = () => ConfigService;
        }
    }
}
