import type { IdentifierService } from "~context/domain/services/identifier.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Identifier {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<IdentifierService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
