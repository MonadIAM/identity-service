declare namespace Repositories {
    namespace RecoveryCode {
        interface Contract extends Repositories.Base.Contract<Entities.RecoveryCode, Adapters.RecoveryCode.Types> {
            getStatus(props: GetStatus.Props): GetStatus.Result;
        }

        namespace GetStatus {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
            };

            type Result = Promise<{
                remaining: number;
                total: number;
                used: number;
            }>;
        }
    }
}
