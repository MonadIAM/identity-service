import { EntityManager } from "@mikro-orm/postgresql";

import { RecoveryCode as RecoveryCodeEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RecoveryCode {
            type Entity = RecoveryCodeEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.RecoveryCode.Types> {
                getStatus: (props: GetStatus.Props) => Promise<GetStatus.Result>;
            }

            namespace GetStatus {
                type Props = {
                    transaction?: EntityManager;
                    account: string;
                };

                type Result = {
                    remaining: number;
                    total: number;
                    used: number;
                };
            }
        }
    }
}
