import { IdentifierRepository } from "~context/infrastructure/repositories/identifier.repository";
import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { IdentifierService } from "~context/domain/services/identifier.service";

export class IdentifierIntegrationHelpers implements Integration.Domain.Identifier.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Identifier.Service.Context {
        const repositories = this.repositories(context);

        return {
            identifierService: new IdentifierService(repositories.identifiers, repositories.accounts),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Identifier.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
            identifiers: new IdentifierRepository(context.readManager),
        };
    }
}
