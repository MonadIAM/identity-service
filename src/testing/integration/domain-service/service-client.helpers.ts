import { ConfigService } from "@nestjs/config";

import { ServiceClientRepository } from "~context/infrastructure/repositories/service-client.repository";
import { ApplicationRepository } from "~context/infrastructure/repositories/application.repository";
import { ServiceClientService } from "~context/domain/services/service-client.service";

export class ServiceClientIntegrationHelpers implements Integration.Domain.ServiceClient.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.ServiceClient.Service.Context {
        const repositories = this.repositories(context);

        return {
            serviceClientService: new ServiceClientService(repositories.serviceClients, repositories.applications),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.ServiceClient.Repositories.Context {
        const config = this.config();

        return {
            serviceClients: new ServiceClientRepository(context.readManager, config),
            applications: new ApplicationRepository(context.readManager, config),
        };
    }

    public config(): ConfigService {
        return new ConfigService({
            SERVICE_CLIENT_PER_APPLICATION_LIMIT: 2,
            APPLICATION_PER_REALM_LIMIT: 2,
        });
    }
}
