import type { ChangeLogService } from "~context/domain/services/change-log.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace ChangeLog {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<ChangeLogService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
