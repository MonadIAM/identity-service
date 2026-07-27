declare namespace Repositories {
    namespace ServiceClient {
        interface Contract extends Repositories.Base.Contract<Entities.ServiceClient, Adapters.ServiceClient.Types> {
            wouldExceedApplicationLimit(props: WouldExceedApplicationLimit.Props): WouldExceedApplicationLimit.Result;
        }

        namespace WouldExceedApplicationLimit {
            type Props = {
                transaction: ORM.EntityManager;
                application: string;
            };

            type Result = Promise<boolean>;
        }
    }
}
