declare namespace Repositories {
    namespace SecondFactor {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.SecondFactor,
            Repositories.Mappers.SecondFactor.Types
        > {}

        interface QueryContract extends Pick<PublicContract, "findUnique" | "findMany"> {}
    }
}
