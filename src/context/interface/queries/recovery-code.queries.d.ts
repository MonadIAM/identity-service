declare namespace Queries {
    namespace RecoveryCode {
        interface ControllerContract {
            getStatus(props: GetStatus.Props): GetStatus.Result;
        }

        interface Contract extends ControllerContract {}

        namespace GetStatus {
            type Result = Repositories.RecoveryCode.GetStatus.Result;
            type Props = Repositories.RecoveryCode.GetStatus.Props;
        }
    }
}
