import { PasswordHistory as PasswordHistoryEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace PasswordHistory {
            type Entity = PasswordHistoryEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.PasswordHistory.Types> {}
        }
    }
}
