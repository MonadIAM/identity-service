import type { AccountService } from "~context/domain/services/account.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Account {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<AccountService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
