import type { InterfaceClientService } from "~context/domain/services/interface-client.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace InterfaceClient {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }
                namespace Service {
                    type Props = {
                        readonly account?: Entities.Account;
                        readonly redirectUriLimit?: number;
                    };

                    type Result = Core.Service.Context<InterfaceClientService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
