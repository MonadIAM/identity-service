import type { MembershipHistoryRepository } from "~context/infrastructure/repositories/membership-history.repository";
import type { MembershipRepository } from "~context/infrastructure/repositories/membership.repository";
import type { TransactionalService } from "~common/transaction-manager/services/transactional.service";
import type { MembershipHistoryService } from "~context/domain/services/membership-history.service";
import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { InviteRepository } from "~context/infrastructure/repositories/invite.repository";
import type { MembershipService } from "~context/domain/services/membership.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Membership {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly membershipHistoryService: MembershipHistoryService;
                        readonly transactionalService: TransactionalService;
                        readonly membershipService: MembershipService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly membershipHistories: MembershipHistoryRepository;
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
