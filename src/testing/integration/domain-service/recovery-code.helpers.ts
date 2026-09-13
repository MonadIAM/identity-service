import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { RecoveryCodeService } from "~context/domain/services/recovery-code.service";

export class RecoveryCodeIntegrationHelpers implements Integration.Domain.RecoveryCode.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.RecoveryCode.Service.Context {
        const repositories = this.repositories(context);

        return {
            recoveryCodeService: new RecoveryCodeService(repositories.accounts),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.RecoveryCode.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
        };
    }
}
