declare namespace Queries {
    namespace SecondFactor {
        type Entity = Repositories.SecondFactor.Entity;

        interface Contract {
            findMany: (props: FindMany) => Promise<[Entity[], number]>;
        }

        type FindMany = {
            account: string;
        };
    }
}
