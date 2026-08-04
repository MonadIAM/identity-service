declare namespace Repositories {
    namespace InterfaceClient {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.InterfaceClient,
            Adapters.InterfaceClient.Types
        > {
            wouldExceedApplicationLimit: WouldExceedApplicationLimit.Signature;
        }

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

        namespace WouldExceedApplicationLimit {
            type Props = {
                transaction: ORM.EntityManager;
                application: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }
    }
}
