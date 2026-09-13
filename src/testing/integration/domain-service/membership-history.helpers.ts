import { MembershipHistoryRepository } from "~context/infrastructure/repositories/membership-history.repository";
import { MembershipHistoryService } from "~context/domain/services/membership-history.service";

export class MembershipHistoryIntegrationHelpers implements Integration.Domain.MembershipHistory.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.MembershipHistory.Service.Context {
        const repositories = this.repositories(context);

        return {
            membershipHistoryService: new MembershipHistoryService(repositories.membershipHistories),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.MembershipHistory.Repositories.Context {
        return {
            membershipHistories: new MembershipHistoryRepository(context.readManager),
        };
    }
}
