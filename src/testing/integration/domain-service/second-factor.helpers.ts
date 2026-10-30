import { SecondFactorRepository } from "~context/infrastructure/repositories/second-factor.repository";
import { IdentifierRepository } from "~context/infrastructure/repositories/identifier.repository";
import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { SecondFactorService } from "~context/domain/services/second-factor.service";
import { IntegrationServiceMockBank } from "~testing/integration/service-mock-bank";

export class SecondFactorIntegrationHelpers
    extends IntegrationServiceMockBank
    implements Integration.Domain.SecondFactor.Contract
{
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.SecondFactor.Service.Context {
        const repositories = this.repositories(context);
        const secret = this.secondFactorSecret();
        const hashing = this.hashing();
        const totp = this.totp();

        return {
            secondFactorService: new SecondFactorService(
                secret,
                repositories.secondFactors,
                repositories.accounts,
                hashing,
                totp,
            ),
            services: {
                hashing,
                secret,
                totp,
            },
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.SecondFactor.Repositories.Context {
        return {
            secondFactors: new SecondFactorRepository(context.readManager),
            identifiers: new IdentifierRepository(context.readManager),
            accounts: new AccountRepository(context.readManager, context.writeManager),
        };
    }
}
