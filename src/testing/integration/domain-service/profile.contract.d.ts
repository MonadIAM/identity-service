declare namespace Integration.Domain.Profile {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            profileService: Services.Profile.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }

    namespace Repositories {
        type Context = {
            accounts: globalThis.Repositories.Account.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }
}
