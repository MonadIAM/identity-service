import type { ConfigService } from "@nestjs/config";

import type { InterfaceClientRepository } from "~context/infrastructure/repositories/interface-client.repository";
import type { ApplicationRepository } from "~context/infrastructure/repositories/application.repository";
import type { InterfaceClientService } from "~context/domain/services/interface-client.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace InterfaceClient {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                    readonly config: Config.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly interfaceClientService: InterfaceClientService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly interfaceClients: InterfaceClientRepository;
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
