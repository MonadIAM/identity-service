import { ConfigService } from "@nestjs/config";

import { ApplicationRepository } from "~context/infrastructure/repositories/application.repository";
import { ApplicationService } from "~context/domain/services/application.service";

export class ApplicationIntegrationHelpers implements Integration.Domain.Application.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Application.Service.Context {
        const repositories = this.repositories(context);

        return {
            applicationService: new ApplicationService(repositories.applications),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Application.Repositories.Context {
        return {
            applications: new ApplicationRepository(context.readManager, this.config()),
        };
    }

    public config(): ConfigService {
        return new ConfigService({
            APPLICATION_PER_REALM_LIMIT: 2,
        });
    }
}
