declare namespace Repositories {
    namespace MembershipHistory {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.MembershipHistory,
            Repositories.Mappers.MembershipHistory.Types
        > {}

        interface QueryContract extends Pick<PublicContract, "findMany"> {}
    }
}
