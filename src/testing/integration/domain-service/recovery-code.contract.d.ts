import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { RecoveryCodeService } from "~context/domain/services/recovery-code.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace RecoveryCode {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly recoveryCodeService: RecoveryCodeService;
                        readonly repositories: Repositories.Context;
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
