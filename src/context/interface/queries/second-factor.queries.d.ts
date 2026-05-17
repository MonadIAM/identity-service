declare namespace Queries {
    namespace SecondFactor {
        interface ControllerContract {
            findMany: (props: FindMany.Props) => FindMany.Result;
        }

        interface Contract extends ControllerContract {}

        namespace FindMany {
            type Props = {
                account: string;
            };

            type Result = Promise<[Entities.SecondFactor[], number]>;
        }
    }
}
