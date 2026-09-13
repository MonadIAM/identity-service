import type { ConfigService } from "@nestjs/config";

import type { ServiceClientRepository } from "~context/infrastructure/repositories/service-client.repository";
import type { ApplicationRepository } from "~context/infrastructure/repositories/application.repository";
import type { ServiceClientService } from "~context/domain/services/service-client.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace ServiceClient {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                    readonly config: Config.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly serviceClientService: ServiceClientService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly serviceClients: ServiceClientRepository;
                        readonly applications: ApplicationRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Config {
                    type Signature = () => ConfigService;
                }
            }
        }
    }
}
