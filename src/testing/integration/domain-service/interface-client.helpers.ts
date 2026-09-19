import { ConfigService } from "@nestjs/config";

import { InterfaceClientRepository } from "~context/infrastructure/repositories/interface-client.repository";
import { InterfaceClientService } from "~context/domain/services/interface-client.service";

export class InterfaceClientIntegrationHelpers implements Integration.Domain.InterfaceClient.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.InterfaceClient.Service.Context {
        const repositories = this.repositories(context);

        return {
            interfaceClientService: new InterfaceClientService(repositories.interfaceClients, this.config()),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.InterfaceClient.Repositories.Context {
        const config = this.config();

        return {
            interfaceClients: new InterfaceClientRepository(context.readManager, config),
        };
    }

    public config(): ConfigService {
        return new ConfigService({
            INTERFACE_CLIENT_PER_REALM_LIMIT: 2,
            INTERFACE_CLIENT_REDIRECT_URI_LIMIT: 2,
        });
    }
}
