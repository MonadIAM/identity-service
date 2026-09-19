import type { SecondFactorService } from "~context/domain/services/second-factor.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace SecondFactor {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<SecondFactorService, { readonly services: ServiceMocks.Contract }>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
