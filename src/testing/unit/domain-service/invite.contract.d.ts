import type { InviteService } from "~context/domain/services/invite.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Invite {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<InviteService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
