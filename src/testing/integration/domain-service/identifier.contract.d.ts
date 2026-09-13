import type { IdentifierRepository } from "~context/infrastructure/repositories/identifier.repository";
import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { IdentifierService } from "~context/domain/services/identifier.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Identifier {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly identifierService: IdentifierService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly identifiers: IdentifierRepository;
                        readonly accounts: AccountRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }
            }
        }
    }
}
