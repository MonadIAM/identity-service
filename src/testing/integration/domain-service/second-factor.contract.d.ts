declare namespace Integration.Domain.SecondFactor {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        secondFactorSecret: SecondFactorSecret.Signature;
        repositories: Repositories.Signature;
        service: Service.Signature;
        hashing: Hashing.Signature;
        totp: TOTP.Signature;
    }

    namespace Service {
        type Context = {
            secondFactorService: Services.SecondFactor.Contract;
            repositories: Repositories.Context;
            services: {
                secret: Integration.ServiceMocks.SecondFactorSecret;
                hashing: Integration.ServiceMocks.Hashing;
                totp: Integration.ServiceMocks.TOTP;
            };
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }

    namespace Repositories {
        type Context = {
            secondFactors: globalThis.Repositories.SecondFactor.Contract;
            identifiers: globalThis.Repositories.Identifier.Contract;
            accounts: globalThis.Repositories.Account.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }

    namespace SecondFactorSecret {
        type Signature = Integration.ServiceMockBank.SecondFactorSecret.Signature;
    }

    namespace Hashing {
        type Signature = Integration.ServiceMockBank.Hashing.Signature;
    }

    namespace TOTP {
        type Signature = Integration.ServiceMockBank.TOTP.Signature;
    }
}
