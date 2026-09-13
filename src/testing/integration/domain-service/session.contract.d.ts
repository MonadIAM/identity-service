import type { ConfigService } from "@nestjs/config";

import type { AccountRepository } from "~context/infrastructure/repositories/account.repository";
import type { SessionRepository } from "~context/infrastructure/repositories/session.repository";
import type { SessionService } from "~context/domain/services/session.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Session {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                    readonly config: Config.Signature;
                    readonly crypto: Crypto.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly maxActiveSessions?: number;
                    };

                    type Context = {
                        readonly repositories: Repositories.Context;
                        readonly sessionService: SessionService;
                        readonly services: {
                            readonly crypto: Integration.ServiceMocks.Crypto;
                            readonly jwt: Integration.ServiceMocks.JWT;
                        };
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly accounts: AccountRepository;
                        readonly sessions: SessionRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly maxActiveSessions?: number;
                    };

                    type Signature = (props?: Props) => ConfigService;
                }

                namespace Crypto {
                    type Signature = Integration.ServiceMockBank.Crypto.Signature;
                }
            }
        }
    }
}
