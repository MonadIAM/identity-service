import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace Account {
            interface Contract extends Repositories.Base.Contract<Entities.Account, Adapters.Account.Types> {
                findExpiredInactive: (props: FindExpiredInactive.Props) => FindExpiredInactive.Result;
                findExpiredPending: (props: FindExpiredPending.Props) => FindExpiredPending.Result;
                getLookupList: (props: GetLookupList.Props) => GetLookupList.Result;
            }

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    term: string;
                };

                type Result = Promise<[Entities.Account[], number]>;
            }

            namespace FindExpiredPending {
                type Props = {
                    expirationDate: Date;
                    batchSize: number;
                    transaction?: EntityManager;
                };

                type Result = Promise<Entities.Account[]>;
            }

            namespace FindExpiredInactive {
                type Props = {
                    expirationDate: Date;
                    batchSize: number;
                    transaction?: EntityManager;
                };

                type Result = Promise<Entities.Account[]>;
            }
        }
    }
}
