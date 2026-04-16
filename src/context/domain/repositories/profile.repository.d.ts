import { Profile as ProfileEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Profile {
            type Entity = ProfileEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.Profile.Types> {}
        }
    }
}
