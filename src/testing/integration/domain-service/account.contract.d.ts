import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { AccountService } from "~context/domain/services/account.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Account {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly repositories: Repositories.Context;
                        readonly accountService: AccountService;
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
