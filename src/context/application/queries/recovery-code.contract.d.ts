declare namespace Queries.RecoveryCode {
    interface Contract extends ControllerContract {}

    interface ControllerContract {
        getStatus: GetStatus.Signature;
    }

    namespace GetStatus {
        type Result = Repositories.RecoveryCode.GetStatus.Result;

        type Props = Repositories.RecoveryCode.GetStatus.Props;

        type Signature = (props: Props) => Result;
    }
}
