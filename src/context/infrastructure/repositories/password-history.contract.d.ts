declare namespace Repositories.PasswordHistory {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.PasswordHistory,
        Repositories.Mappers.PasswordHistory.Types
    > {}
}
