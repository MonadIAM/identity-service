import type { MembershipHistoryService } from "~context/domain/services/membership-history.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace MembershipHistory {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<MembershipHistoryService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
