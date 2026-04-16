import { MasterCode as MasterCodeEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace MasterCode {
            type Entity = MasterCodeEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.MasterCode.Types> {}
        }
    }
}
