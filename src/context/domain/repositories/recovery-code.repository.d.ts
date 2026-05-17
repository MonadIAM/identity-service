import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RecoveryCode {
            interface Contract extends Repositories.Base.Contract<Entities.RecoveryCode, Adapters.RecoveryCode.Types> {
                getStatus: (props: GetStatus.Props) => GetStatus.Result;
            }

            namespace GetStatus {
                type Props = {
                    transaction?: EntityManager;
                    account: string;
                };

                type Result = Promise<{
                    remaining: number;
                    total: number;
                    used: number;
                }>;
            }
        }
    }
}
