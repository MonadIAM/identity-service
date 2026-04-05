declare namespace Queries {
    namespace Session {
        type Entity = Repositories.Session.Entity;

        interface Contract {
            findMany: (props: FindMany) => Promise<[Entity[], number]>;
            getCurrent: (props: GetCurrent) => Promise<Entity>;
        }

        type GetCurrent = {
            account: string;
            session: string;
        };

        type FindMany = {
            account: string;
        };
    }
}
