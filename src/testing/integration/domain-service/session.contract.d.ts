import type { ConfigService } from "@nestjs/config";

declare global {
    namespace Integration.Domain.Session {
        type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

        interface Contract {
            repositories: Repositories.Signature;
            service: Service.Signature;
            config: Config.Signature;
            crypto: Crypto.Signature;
        }

        namespace Service {
            type Props = {
                maxActiveSessions?: number;
            };

            type Context = {
                sessionService: Services.Session.Contract;
                repositories: Repositories.Context;
                services: {
                    crypto: Integration.ServiceMocks.Crypto;
                    jwt: Integration.ServiceMocks.JWT;
                };
            };

            type Signature = (context: Postgres.Suite.FactoryContext, props?: Props) => Context;
        }

        namespace Repositories {
            type Context = {
                accounts: globalThis.Repositories.Account.Contract;
                sessions: globalThis.Repositories.Session.Contract;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace Config {
            type Props = {
                maxActiveSessions?: number;
            };

            type Signature = (props?: Props) => ConfigService;
        }

        namespace Crypto {
            type Signature = Integration.ServiceMockBank.Crypto.Signature;
        }
    }
}
