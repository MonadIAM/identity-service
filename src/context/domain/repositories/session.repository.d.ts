declare namespace Repositories {
    namespace Session {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<Entities.Session, Repositories.Mappers.Session.Types> {
            lockByAccount: LockByAccount.Signature;
        }

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

        namespace LockByAccount {
            type Props = {
                transaction: ORM.EntityManager;
                account: string;
            };

            type Result = Promise<Entities.Session[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
