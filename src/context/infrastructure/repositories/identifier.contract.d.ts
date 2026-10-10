declare namespace Repositories.Identifier {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.Identifier,
        Repositories.Mappers.Identifier.Types
    > {
        isLastVerifiedIdentifier: IsLastVerifiedIdentifier.Signature;
        getLookupList: GetLookupList.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "getLookupList" | "findMany"> {}

    namespace IsLastVerifiedIdentifier {
        type Props = {
            transaction?: ORM.EntityManager;
            identifier: string;
            account: string;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }

    namespace GetLookupList {
        type Props = {
            pagination: Pagination;
            account: string;
            term: string;
        };

        type Result = Promise<[Entities.Identifier[], number]>;

        type Signature = (props: Props) => Result;
    }
}
