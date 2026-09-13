import { ConfigService } from "@nestjs/config";

import { PasswordHistoryRepository } from "~context/infrastructure/repositories/password-history.repository";
import { IdentifierRepository } from "~context/infrastructure/repositories/identifier.repository";
import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { IntegrationServiceMockBank } from "~testing/integration/service-mock-bank";
import { PasswordService } from "~context/domain/services/password.service";

export class PasswordIntegrationHelpers extends IntegrationServiceMockBank implements Integration.Domain.Password.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Password.Service.Context {
        const repositories = this.repositories(context);
        const hashing = this.hashing();
        const config = this.config();

        return {
            passwordService: new PasswordService(
                repositories.passwordHistory,
                repositories.identifiers,
                repositories.accounts,
                hashing,
                config,
            ),
            services: {
                hashing,
            },
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Password.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
            passwordHistory: new PasswordHistoryRepository(context.readManager),
            identifiers: new IdentifierRepository(context.readManager),
        };
    }

    public config(): ConfigService {
        return new ConfigService({
            PASSWORD_HISTORY_CHECK_DAYS: "30d",
        });
    }
}
