import { MembershipHistoryRepository } from "~context/infrastructure/repositories/membership-history.repository";
import { TransactionalService } from "~common/transaction-manager/services/transactional.service";
import { MembershipRepository } from "~context/infrastructure/repositories/membership.repository";
import { MembershipHistoryService } from "~context/domain/services/membership-history.service";
import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { InviteRepository } from "~context/infrastructure/repositories/invite.repository";
import { IntegrationServiceMockBank } from "~testing/integration/service-mock-bank";
import { MembershipService } from "~context/domain/services/membership.service";
import { ChangeLogSubscriber } from "~common/transaction-manager/subscribers";
import { OperationContext } from "~common/transaction-manager/utilities";

export class MembershipIntegrationHelpers
    extends IntegrationServiceMockBank
    implements Integration.Domain.Membership.Contract
{
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Membership.Service.Context {
        const repositories = this.repositories(context);
        const logMaskingService = this.logMasking();
        const outboxService = this.outbox();

        const writeManager = context.orm.em.fork({ freshEventManager: true });

        const membershipHistoryService = new MembershipHistoryService(repositories.membershipHistories);
        const operationContext = new OperationContext();

        writeManager
            .getEventManager()
            .registerSubscriber(new ChangeLogSubscriber(logMaskingService, outboxService, operationContext));

        return {
            membershipService: new MembershipService(
                membershipHistoryService,
                repositories.memberships,
                repositories.accounts,
                repositories.invites,
            ),
            transactionalService: new TransactionalService(
                writeManager,
                logMaskingService,
                outboxService,
                operationContext,
            ),
            membershipHistoryService,
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Membership.Repositories.Context {
        return {
            accounts: new AccountRepository(context.readManager, context.writeManager),
            membershipHistories: new MembershipHistoryRepository(context.readManager),
            memberships: new MembershipRepository(context.readManager),
            invites: new InviteRepository(context.readManager),
        };
    }
}
