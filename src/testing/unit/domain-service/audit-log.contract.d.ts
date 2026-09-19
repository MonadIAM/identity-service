import type { AuditLogService } from "~context/domain/services/audit-log.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace AuditLog {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<AuditLogService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
