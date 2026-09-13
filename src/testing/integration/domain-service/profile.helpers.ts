import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { ProfileService } from "~context/domain/services/profile.service";

export class ProfileIntegrationHelpers implements Integration.Domain.Profile.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Profile.Service.Context {
        const repositories = this.repositories(context);

        return {
            profileService: new ProfileService(repositories.accounts),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Profile.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
        };
    }
}
