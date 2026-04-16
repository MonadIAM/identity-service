declare namespace Queries {
    namespace Session {
        type Entity = Repositories.Session.Entity;

        interface Contract {
            getCurrent: (props: GetCurrent.Props) => Promise<GetCurrent.Result>;
            findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
        }

        namespace GetCurrent {
            type Props = {
                account: string;
                session: string;
            };

            type Result = Entity;
        }

        namespace FindMany {
            type Props = {
                account: string;
            };

            type Result = [Entity[], number];
        }
    }
}
