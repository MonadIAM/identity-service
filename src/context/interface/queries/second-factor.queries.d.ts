declare namespace Queries {
    namespace SecondFactor {
        type Entity = Repositories.SecondFactor.Entity;

        interface Contract {
            findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
        }

        namespace FindMany {
            type Props = {
                account: string;
            };

            type Result = [Entity[], number];
        }
    }
}
