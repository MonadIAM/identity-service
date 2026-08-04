declare namespace Repositories {
    namespace Membership {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<Entities.Membership, Adapters.Membership.Types> {}
    }
}
