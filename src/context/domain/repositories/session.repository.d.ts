declare namespace Repositories {
    namespace Session {
        interface Contract extends Repositories.Base.Contract<Entities.Session, Adapters.Session.Types> {
            lockByAccount(props: LockByAccount.Props): Promise<Entities.Session[]>;
        }

        namespace LockByAccount {
            type Props = {
                transaction: ORM.EntityManager;
                account: string;
            };
        }
    }
}
