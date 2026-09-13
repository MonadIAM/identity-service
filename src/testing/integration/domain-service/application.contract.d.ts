import type { ConfigService } from "@nestjs/config";

import type { ApplicationRepository } from "~context/infrastructure/repositories/application.repository";
import type { ApplicationService } from "~context/domain/services/application.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Application {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                    readonly config: Config.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly applicationService: ApplicationService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
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
