declare namespace Queries {
    namespace Session {
        interface ControllerContract {
            getCurrent: (props: GetCurrent.Props) => GetCurrent.Result;
            findMany: (props: FindMany.Props) => FindMany.Result;
        }

        interface Contract extends ControllerContract {}

        namespace GetCurrent {
            type Props = {
                account: string;
                session: string;
            };

            type Result = Promise<Entities.Session>;
        }

        namespace FindMany {
            type Props = {
                account: string;
            };

            type Result = Promise<[Entities.Session[], number]>;
        }
    }
}
