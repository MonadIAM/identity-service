import type { ServiceClientService } from "~context/domain/services/service-client.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace ServiceClient {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }
                namespace Service {
                    type Props = {
                        readonly application?: Entities.Application;
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<ServiceClientService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
