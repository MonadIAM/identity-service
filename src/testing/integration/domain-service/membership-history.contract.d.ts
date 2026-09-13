import type { MembershipHistoryRepository } from "~context/infrastructure/repositories/membership-history.repository";
import type { MembershipHistoryService } from "~context/domain/services/membership-history.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace MembershipHistory {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly membershipHistoryService: MembershipHistoryService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly membershipHistories: MembershipHistoryRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }
            }
        }
    }
}
