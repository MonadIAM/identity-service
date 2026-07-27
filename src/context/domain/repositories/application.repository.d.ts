declare namespace Repositories {
    namespace Application {
        interface Contract extends Repositories.Base.Contract<Entities.Application, Adapters.Application.Types> {
            wouldExceedRealmLimit(props: WouldExceedRealmLimit.Props): WouldExceedRealmLimit.Result;
        }

        namespace WouldExceedRealmLimit {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
            };

            type Result = Promise<boolean>;
        }
    }
}
