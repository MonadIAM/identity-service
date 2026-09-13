import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { AccountService } from "~context/domain/services/account.service";

export class AccountIntegrationHelpers implements Integration.Domain.Account.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Account.Service.Context {
        const repositories = this.repositories(context);

        return {
            accountService: new AccountService(repositories.accounts),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Account.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
        };
    }
}
