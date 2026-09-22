declare namespace Integration.Domain.Identifier {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            identifierService: Services.Identifier.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }

    namespace Repositories {
        type Context = {
            identifiers: globalThis.Repositories.Identifier.Contract;
            accounts: globalThis.Repositories.Account.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }
}
