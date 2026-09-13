import type { MembershipRepository } from "~context/infrastructure/repositories/membership.repository";
import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { InviteRepository } from "~context/infrastructure/repositories/invite.repository";
import type { InviteService } from "~context/domain/services/invite.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Invite {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly repositories: Repositories.Context;
                        readonly inviteService: InviteService;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly memberships: MembershipRepository;
                        readonly accounts: AccountRepository;
                        readonly invites: InviteRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }
            }
        }
    }
}
