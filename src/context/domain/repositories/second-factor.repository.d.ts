import { SecondFactor as SecondFactorEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace SecondFactor {
            type Entity = SecondFactorEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.SecondFactor.Types> {}
        }
    }
}
