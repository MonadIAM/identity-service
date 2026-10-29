import { AccountStatus } from "~context/enums";

declare global {
    namespace Repositories.Account {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<Entities.Account, Repositories.Mappers.Account.Types> {
            findExpiredDeactivated: FindExpiredDeactivated.Signature;
            findExpiredInactive: FindExpiredInactive.Signature;
            findExpiredPending: FindExpiredPending.Signature;
            getLookupList: GetLookupList.Signature;
        }

        namespace FindExpiredDeactivated {
            type Props = {
                transaction: ORM.EntityManager;
                expirationDate: Date;
                batchSize: number;
            };

            type Result = Promise<Entities.Account[]>;

            type Signature = (props: Props) => Result;
        }

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "getLookupList" | "findMany"> {}

        namespace FindExpiredInactive {
            type Props = {
                expirationDate: Date;
                batchSize: number;
                transaction?: ORM.EntityManager;
            };

            type Result = Promise<Entities.Account[]>;

            type Signature = (props: Props) => Result;
        }

        namespace FindExpiredPending {
            type Props = {
                expirationDate: Date;
                batchSize: number;
                transaction?: ORM.EntityManager;
            };

            type Result = Promise<Entities.Account[]>;

            type Signature = (props: Props) => Result;
        }

        namespace GetLookupList {
            type Row = {
                id: string;
                status: AccountStatus;
                displayName: string;
                identifier: Nullable<string>;
            };

            type CountRow = {
                total: string;
            };

            type Props = {
                pagination: Pagination;
                term: string;
            };

            type Result = Promise<[Row[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
