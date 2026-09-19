import type { ProfileService } from "~context/domain/services/profile.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace Profile {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Props = {
                        readonly account?: Entities.Account;
                    };

                    type Result = Core.Service.Context<ProfileService>;

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
