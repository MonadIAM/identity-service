declare namespace Integration.Domain.Account {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            repositories: Repositories.Context;
            accountService: Services.Account.Contract;
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
