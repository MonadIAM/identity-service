declare namespace Queries {
    namespace RecoveryCode {
        interface Contract {
            getStatus: (props: GetStatus.Props) => Promise<GetStatus.Result>;
        }

        namespace GetStatus {
            type Props = Repositories.RecoveryCode.GetStatus.Props;
            type Result = Repositories.RecoveryCode.GetStatus.Result;
        }
    }
}
