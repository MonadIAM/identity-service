declare namespace Queries {
    namespace Session {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            getCurrent: GetCurrent.Signature;
            findMany: FindMany.Signature;
        }

        namespace GetCurrent {
            type Props = {
                account: string;
                session: string;
            };

            type Result = Promise<Entities.Session>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type Props = {
                account: string;
            };

            type Result = Promise<[Entities.Session[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
