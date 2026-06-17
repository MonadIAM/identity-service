declare namespace Queries {
    namespace SecondFactor {
        interface ControllerContract {
            getQRCode(props: GetQRCode.Props): GetQRCode.Result;
            findMany(props: FindMany.Props): FindMany.Result;
        }

        interface Contract extends ControllerContract {}

        namespace FindMany {
            type Props = {
                account: string;
            };

            type Result = Promise<[Entities.SecondFactor[], number]>;
        }

        namespace GetQRCode {
            type Props = {
                actor: string;
                id: string;
            };

            type Result = Promise<{
                id: string;
                uri: string;
            }>;
        }
    }
}
