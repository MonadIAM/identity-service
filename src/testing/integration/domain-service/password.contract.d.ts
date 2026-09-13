import type { ConfigService } from "@nestjs/config";

import type { PasswordHistoryRepository } from "~context/infrastructure/repositories/password-history.repository";
import type { IdentifierRepository } from "~context/infrastructure/repositories/identifier.repository";
import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { PasswordService } from "~context/domain/services/password.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Password {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                    readonly hashing: Hashing.Signature;
                    readonly config: Config.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly repositories: Repositories.Context;
                        readonly passwordService: PasswordService;
                        readonly services: {
                            readonly hashing: Integration.ServiceMocks.Hashing;
                        };
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly passwordHistory: PasswordHistoryRepository;
                        readonly identifiers: IdentifierRepository;
                        readonly accounts: AccountRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Config {
                    type Signature = () => ConfigService;
                }

                namespace Hashing {
                    type Signature = Integration.ServiceMockBank.Hashing.Signature;
                }
            }
        }
    }
}
