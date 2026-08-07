declare namespace Repositories {
    namespace RecoveryCode {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.RecoveryCode,
            Repositories.Mappers.RecoveryCode.Types
        > {
            getStatus: GetStatus.Signature;
        }

        interface QueryContract extends Pick<PublicContract, "getStatus"> {}

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

            type Signature = (props: Props) => Result;
        }
    }
}
