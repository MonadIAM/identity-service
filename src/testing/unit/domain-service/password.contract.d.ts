import type { PasswordService } from "~context/domain/services/password.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Password {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                        readonly historyCheckDays?: string;
                    };

                    type Result = Core.Service.Context<PasswordService, { readonly services: ServiceMocks.Contract }>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
