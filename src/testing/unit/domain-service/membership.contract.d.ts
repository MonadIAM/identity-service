import type { MembershipService } from "~context/domain/services/membership.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Membership {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<MembershipService, { readonly services: ServiceMocks.Contract }>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
