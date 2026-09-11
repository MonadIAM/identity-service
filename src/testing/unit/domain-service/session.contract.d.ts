import type { SessionService } from "~context/domain/services/session.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Session {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly maxActiveSessions?: number;
                        readonly sessionExpiryDays?: string;
                        readonly account?: Entities.Account;
                        readonly accessTokenTTL?: string;
                    };

                    type Result = Core.Service.Context<SessionService, { readonly services: ServiceMocks.Contract }>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
