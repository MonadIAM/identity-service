import { Session as SessionEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Session {
            type Entity = SessionEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.Session.Types> {}
        }
    }
}
