import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { ProfileService } from "~context/domain/services/profile.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Profile {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly repositories: Repositories.Context;
                        readonly profileService: ProfileService;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly accounts: AccountRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }
            }
        }
    }
}
