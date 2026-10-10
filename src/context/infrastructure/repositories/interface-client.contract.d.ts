declare namespace Repositories.InterfaceClient {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.InterfaceClient,
        Repositories.Mappers.InterfaceClient.Types
    > {
        wouldExceedRealmLimit: WouldExceedRealmLimit.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

    namespace WouldExceedRealmLimit {
        type Props = {
            transaction: ORM.EntityManager;
            realm: string;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }
}
