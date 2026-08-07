declare namespace Repositories {
    namespace PasswordHistory {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.PasswordHistory,
            Repositories.Mappers.PasswordHistory.Types
        > {}
    }
}
