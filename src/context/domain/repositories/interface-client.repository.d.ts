import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace InterfaceClient {
            interface Contract
                extends Repositories.Base.Contract<Entities.InterfaceClient, Adapters.InterfaceClient.Types> {
                wouldExceedApplicationLimit(props: WouldExceedApplicationLimit.Props): WouldExceedApplicationLimit.Result;
            }

            namespace WouldExceedApplicationLimit {
                type Props = {
                    transaction: EntityManager;
                    application: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
