import { Password as PasswordEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Password {
            type Entity = PasswordEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.Password.Types> {}
        }
    }
}
