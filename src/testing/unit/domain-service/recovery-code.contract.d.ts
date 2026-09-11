import type { RecoveryCodeService } from "~context/domain/services/recovery-code.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace RecoveryCode {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<RecoveryCodeService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
