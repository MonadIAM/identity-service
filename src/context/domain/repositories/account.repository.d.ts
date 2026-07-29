import { AccountStatus } from "~context/enums";

declare global {
    namespace Repositories {
        namespace Account {
            interface Contract extends Repositories.Base.Contract<Entities.Account, Adapters.Account.Types> {
                findExpiredInactive(props: FindExpiredInactive.Props): FindExpiredInactive.Result;
                findExpiredPending(props: FindExpiredPending.Props): FindExpiredPending.Result;
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
            }

            namespace GetLookupList {
                type Row = {
                    id: string;
                    status: AccountStatus;
                    displayName: string;
                    identifier: string | null;
                };

                type CountRow = {
                    total: string;
                };

                type Props = {
                    pagination: Pagination;
                    term: string;
                };

                type Result = Promise<[Row[], number]>;
            }

            namespace FindExpiredPending {
                type Props = {
                    expirationDate: Date;
                    batchSize: number;
                    transaction?: ORM.EntityManager;
                };

                type Result = Promise<Entities.Account[]>;
            }

            namespace FindExpiredInactive {
                type Props = {
                    expirationDate: Date;
                    batchSize: number;
                    transaction?: ORM.EntityManager;
                };

                type Result = Promise<Entities.Account[]>;
            }
        }
    }
}
