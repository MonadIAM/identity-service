import { MembershipRepository } from "~context/infrastructure/repositories/membership.repository";
import { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import { InviteRepository } from "~context/infrastructure/repositories/invite.repository";
import { InviteService } from "~context/domain/services/invite.service";

export class InviteIntegrationHelpers implements Integration.Domain.Invite.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.Invite.Service.Context {
        const repositories = this.repositories(context);

        return {
            inviteService: new InviteService(repositories.memberships, repositories.accounts, repositories.invites),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.Invite.Repositories.Context {
        return {
            memberships: new MembershipRepository(context.readManager),
            accounts: new AccountRepository(context.readManager, context.writeManager),
            invites: new InviteRepository(context.readManager),
        };
    }
}
