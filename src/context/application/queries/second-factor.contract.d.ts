declare namespace Queries.SecondFactor {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        getQRCode: GetQRCode.Signature;
        findMany: FindMany.Signature;
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

        type Signature = (props: Props) => Result;
    }

    namespace FindMany {
        type Props = {
            account: string;
        };

        type Result = Promise<[Entities.SecondFactor[], number]>;

        type Signature = (props: Props) => Result;
    }
}
